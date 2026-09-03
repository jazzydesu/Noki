import { useEffect, useRef, useState } from 'react'
import './LocationPicker.css'
import Icon from './components/Icons'

const SEARCH_API_URL = 'https://nominatim.openstreetmap.org/search'
const SEARCH_DEBOUNCE_MS = 400

function LocationPicker({ isOpen, _placeName, onLocationSelect, onRequestGps, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const searchTimeoutRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const performSearch = async (q) => {
    if (!q.trim()) {
      setResults([])
      setError('')
      return
    }

    setSearching(true)
    setError('')
    try {
      const params = new URLSearchParams({
        q: q.trim(),
        format: 'json',
        limit: 8,
        addressdetails: 1,
      })
      const response = await fetch(`${SEARCH_API_URL}?${params}`, {
        headers: { 'Accept': 'application/json' },
        referrerPolicy: 'no-referrer',
      })
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      if (Array.isArray(data)) {
        setResults(data)
        if (data.length === 0) setError('No places found. Try a different search.')
      } else {
        setError('No places found. Try a different search.')
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.error('LocationPicker search error:', detail)
      setError(detail ? `Search error: ${detail}` : 'Could not search locations. Please try again.')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleQueryChange = (e) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => performSearch(newQuery), SEARCH_DEBOUNCE_MS)
  }

  const handleResultSelect = (result) => {
    onLocationSelect({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
    })
    onClose()
  }

  const handleGpsClick = () => {
    onRequestGps()
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={`location-picker-backdrop ${isOpen ? 'is-open' : ''}`} onClick={handleBackdropClick} aria-hidden={!isOpen}>
      <div className={`location-picker-sheet ${isOpen ? 'is-open' : ''}`}>
        <div className="location-picker-handle" aria-hidden="true" />
        <div className="location-picker-header">
          <h2>Choose location</h2>
          <button type="button" className="location-picker-close" onClick={onClose} aria-label="Close location picker"><Icon name="close" /></button>
        </div>
        <input
          ref={inputRef}
          type="text"
          className="location-picker-input"
          placeholder="Search for a place..."
          value={query}
          onChange={handleQueryChange}
        />

        <div className="location-picker-results">
          <button type="button" className="location-option current-location" onClick={handleGpsClick}>
            <span aria-hidden="true"><Icon name="pin" size={18} /></span>
            <span>Use my current location</span>
          </button>

          {error && <p className="location-error">{error}</p>}

          {searching && <p className="location-loading">Searching...</p>}

          {!searching && results.length > 0 && (
            <ul className="location-results-list">
              {results.map((result) => {
                const address = result.address || {}
                const city = address.city || address.town || address.village || address.municipality || result.name
                const region = address.state || address.region || address.country || ''
                return (
                  <li key={`${result.lat}-${result.lon}`}>
                    <button
                      type="button"
                      className="location-result"
                      onClick={() => handleResultSelect(result)}
                    >
                      <span className="location-result-name">{city}</span>
                      {region && <span className="location-result-region">{region}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default LocationPicker
