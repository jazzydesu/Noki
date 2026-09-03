import { useEffect, useRef, useState } from 'react'
import {
  LOCATION_MAX_AGE_MS,
  LOCATION_STORAGE_KEY,
  REVERSE_GEOCODE_URL,
} from '../config'
import { fetchScore as fetchScoreFromApi } from '../scorer'
import { AppContext } from './context'

const EVENT_STORAGE_KEY = 'noki-event'
const SAVED_SPOTS_STORAGE_KEY = 'noki-saved-spots'
const WELCOME_DISMISSED_KEY = 'noki-welcome-dismissed'

function readJson(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key))
    return value ?? fallback
  } catch {
    return fallback
  }
}

function readLocation() {
  const saved = readJson(LOCATION_STORAGE_KEY, null)
  if (!saved || Date.now() - saved.timestamp >= LOCATION_MAX_AGE_MS) return null
  if (typeof saved.latitude !== 'number' || typeof saved.longitude !== 'number') return null
  return saved
}

function saveLocation(coords) {
  try {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: Date.now(),
    }))
  } catch (error) {
    console.error('Unable to cache location', error)
  }
}

async function findPlaceName(latitude, longitude) {
  try {
    const params = new URLSearchParams({ lat: latitude, lon: longitude, format: 'jsonv2', zoom: '10' })
    const response = await fetch(`${REVERSE_GEOCODE_URL}?${params}`)
    if (!response.ok) return null
    const data = await response.json()
    const address = data.address || {}
    const place = address.city || address.town || address.village || address.municipality || address.county
    return place && address.country ? `${place}, ${address.country}` : place || null
  } catch (error) {
    console.error('Unable to reverse geocode location', error)
    return null
  }
}

function readEvent() {
  const event = window.localStorage.getItem(EVENT_STORAGE_KEY)
  return event === 'sunrise' ? 'sunrise' : 'sunset'
}

function writeEvent(event) {
  try {
    window.localStorage.setItem(EVENT_STORAGE_KEY, event)
  } catch (error) {
    console.error('Unable to cache event preference', error)
  }
}

function readWelcomeDismissed() {
  try {
    return window.localStorage.getItem(WELCOME_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeWelcomeDismissed() {
  try {
    window.localStorage.setItem(WELCOME_DISMISSED_KEY, '1')
  } catch (error) {
    console.error('Unable to persist welcome dismissal', error)
  }
}

function readSavedSpots() {
  const spots = readJson(SAVED_SPOTS_STORAGE_KEY, [])
  return Array.isArray(spots) ? spots.filter((spot) => (
    spot && typeof spot.latitude === 'number' && typeof spot.longitude === 'number'
    && (spot.event === 'sunrise' || spot.event === 'sunset')
  )) : []
}

function writeSavedSpots(spots) {
  try {
    window.localStorage.setItem(SAVED_SPOTS_STORAGE_KEY, JSON.stringify(spots))
  } catch (error) {
    console.error('Unable to save spots', error)
  }
}

export function AppProvider({ children }) {
  const [location, setLocation] = useState(readLocation)
  const [placeName, setPlaceName] = useState(null)
  const [event, setEventState] = useState(readEvent)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [eventChooserOpen, setEventChooserOpen] = useState(false)
  const [savedSpots, setSavedSpots] = useState(readSavedSpots)
  const [welcomeDismissed, setWelcomeDismissed] = useState(readWelcomeDismissed)

  const dismissWelcome = () => {
    setWelcomeDismissed(true)
    writeWelcomeDismissed()
  }

  const fetchScore = async (coords = location, eventType = event) => {
    if (!coords) return null
    setStatus('loading')
    setMessage('')
    const placePromise = findPlaceName(coords.latitude, coords.longitude)
    try {
      const data = await fetchScoreFromApi(coords.latitude, coords.longitude, eventType)
      setResult(data)
      setStatus('success')
      const resolvedPlace = await placePromise
      if (resolvedPlace) {
        setPlaceName(resolvedPlace)
        setLocation({ ...coords, placeName: resolvedPlace })
      }
      return data
    } catch (error) {
      console.error('Unable to load score', error)
      setResult(null)
      setStatus('error')
      const detail = error instanceof Error ? error.message : String(error)
      const isNetworkFailure = /failed to fetch|networkerror|load failed|fetch/i.test(detail)
      setMessage(isNetworkFailure
        ? 'The forecast could not be loaded because the network request failed. Please check your connection or choose a location manually.'
        : detail || 'The forecast could not be loaded right now.')
      return null
    }
  }

  const chooseEvent = (nextEvent) => {
    if (nextEvent !== 'sunrise' && nextEvent !== 'sunset') return
    setEventState(nextEvent)
    writeEvent(nextEvent)
    setEventChooserOpen(false)
    fetchScore(location, nextEvent)
  }

  const selectLocation = (coords, prompt = true) => {
    const nextLocation = { latitude: coords.latitude, longitude: coords.longitude }
    saveLocation(nextLocation)
    setLocation(nextLocation)
    setPlaceName(coords.displayName || null)
    setPickerOpen(false)
    if (prompt) {
      setResult(null)
      setStatus('loading')
      setEventChooserOpen(true)
    } else {
      fetchScore(nextLocation, event)
    }
  }

  const geoWatchRef = useRef(null)

  const clearGeoWatch = () => {
    if (geoWatchRef.current) {
      window.clearTimeout(geoWatchRef.current)
      geoWatchRef.current = null
    }
  }

  const requestLocation = () => {
    clearGeoWatch()
    setStatus('locating')
    setResult(null)
    setMessage('')

    const geolocationUnavailableMessage = 'Location access needs a secure connection - please search for your location manually instead.'
    const handleGeolocationFailure = (error) => {
      clearGeoWatch()
      const browserMessage = error && error.message ? error.message : ''
      const insecureContext = typeof window !== 'undefined' && !window.isSecureContext
      const isGeoBlocked = error && (error.code === 1 || error.code === 2 || error.code === 3)
      const detail = browserMessage ? ` Details: ${browserMessage}` : ''
      setStatus('error')
      setMessage((insecureContext || !navigator.geolocation || isGeoBlocked)
        ? `${geolocationUnavailableMessage}${detail}`
        : `Location access isn't available - try entering a location manually instead.${detail}`)
      setPickerOpen(true)
    }

    geoWatchRef.current = window.setTimeout(() => {
      geoWatchRef.current = null
      setStatus('error')
      setMessage('Location access needs a secure connection - please search for your location manually instead.')
      setPickerOpen(true)
    }, 30000)
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      import('@capacitor/geolocation').then(({ Geolocation }) => {
        Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 })
          .then(({ coords }) => { clearGeoWatch(); selectLocation(coords, false) })
          .catch(handleGeolocationFailure)
      }).catch(handleGeolocationFailure)
      return
    }
    if (!navigator.geolocation || typeof window !== 'undefined' && !window.isSecureContext) {
      clearGeoWatch()
      setStatus('error')
      setMessage(geolocationUnavailableMessage)
      setPickerOpen(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { clearGeoWatch(); selectLocation(coords, false) },
      handleGeolocationFailure,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  const toggleEvent = () => chooseEvent(event === 'sunset' ? 'sunrise' : 'sunset')

  const saveSpot = () => {
    if (!location || !placeName) return
    const spot = { latitude: location.latitude, longitude: location.longitude, placeName, event }
    const next = savedSpots.some((item) => item.latitude === spot.latitude && item.longitude === spot.longitude && item.event === event)
      ? savedSpots
      : [...savedSpots, spot]
    setSavedSpots(next)
    writeSavedSpots(next)
  }

  const removeSpot = (spot) => {
    const next = savedSpots.filter((item) => !(item.latitude === spot.latitude && item.longitude === spot.longitude && item.event === spot.event))
    setSavedSpots(next)
    writeSavedSpots(next)
  }

  const loadSavedSpot = (spot) => {
    setEventState(spot.event)
    writeEvent(spot.event)
    setPlaceName(spot.placeName)
    const nextLocation = { latitude: spot.latitude, longitude: spot.longitude }
    setLocation(nextLocation)
    saveLocation(nextLocation)
    fetchScore(nextLocation, spot.event)
  }

  const didInit = useRef(false)
  const initRef = useRef({ event, fetchScore, setPickerOpen, setStatus })
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    const timer = window.setTimeout(() => {
      const initialLocation = readLocation()
      if (initialLocation) {
        initRef.current.fetchScore(initialLocation, initRef.current.event)
      } else {
        initRef.current.setStatus('locating')
        initRef.current.setPickerOpen(true)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const value = {
    location, placeName, event, result, status, message, pickerOpen, eventChooserOpen, savedSpots,
    welcomeDismissed, dismissWelcome,
    setPickerOpen, setEventChooserOpen, chooseEvent, toggleEvent, selectLocation, requestLocation,
    fetchScore, saveSpot, removeSpot, loadSavedSpot,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

