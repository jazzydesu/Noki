const TEMPERATURE_MAX = 15
const CANVAS_MAX = 25
const LOW_CLOUD_MAX = 20
const HUMIDITY_MAX = 10
const VISIBILITY_MAX = 10
const TOTAL_CLOUD_MAX = 10
const MAX_POSITIVE_SCORE = TEMPERATURE_MAX + CANVAS_MAX + LOW_CLOUD_MAX + HUMIDITY_MAX + VISIBILITY_MAX + TOTAL_CLOUD_MAX

function findEventIndex(hourlyTimes, eventTime) {
  const target = new Date(eventTime).getTime()
  let bestIdx = 0
  let minDiff = Infinity
  hourlyTimes.forEach((t, idx) => {
    const diff = Math.abs(new Date(t).getTime() - target)
    if (diff < minDiff) {
      minDiff = diff
      bestIdx = idx
    }
  })
  return bestIdx
}

function formatEventTime(iso, utcOffsetSeconds) {
  const d = new Date(iso)
  const ms = d.getTime() + utcOffsetSeconds * 1000
  const local = new Date(ms)
  let hours = local.getUTCHours()
  const minutes = local.getUTCMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

function formatEventDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function buildFiveDayForecast(data, currentEventIso, event) {
  const events = data.daily?.[event] || []
  const hourly = data.hourly || {}
  const hourlyTimes = hourly.time || []
  if (!events.length || !hourlyTimes.length) return []

  let startIdx = events.indexOf(currentEventIso)
  if (startIdx < 0) startIdx = 0
  const upcoming = events.slice(startIdx + 1, startIdx + 6)

  return upcoming.map((iso) => {
    try {
      const { score } = scoreSunset(hourly, findEventIndex(hourlyTimes, iso))
      const eventDate = new Date(iso)
      return {
        day_name: eventDate.toLocaleDateString('en-US', { weekday: 'short' }),
        short_date: `${eventDate.toLocaleDateString('en-US', { month: 'short' })} ${eventDate.getDate()}`,
        event_time: formatEventTime(iso, data.utc_offset_seconds || 0),
        score,
        sunset_iso: iso,
        event,
      }
    } catch {
      return null
    }
  }).filter(Boolean)
}

export function scoreSunset(hourly, idx) {
  const notes = []
  let score = 0

  const totalCloud = hourly.cloud_cover?.[idx] ?? 0
  const midCloud = hourly.cloud_cover_mid?.[idx] ?? 0
  const highCloud = hourly.cloud_cover_high?.[idx] ?? 0
  const lowCloud = hourly.cloud_cover_low?.[idx] ?? 0
  const humidity = hourly.relative_humidity_2m?.[idx] ?? 0
  const visMeters = hourly.visibility?.[idx] ?? 0
  const visKm = visMeters / 1000
  const precipProb = hourly.precipitation_probability?.[idx] ?? 0
  const tempC = hourly.temperature_2m?.[idx] ?? 0

  const maxUpper = Math.max(midCloud, highCloud)
  const combinedCanvas = (midCloud + highCloud) / 2

  if (maxUpper >= 30 || combinedCanvas >= 25 || (midCloud + highCloud) >= 40) {
    score += 25
    if (highCloud >= 30 && midCloud < 20) {
      notes.push(`High cirrus clouds (${highCloud}%) create ideal twilight color scattering`)
    } else if (midCloud >= 30 && highCloud < 20) {
      notes.push(`Mid-level altocumulus clouds (${midCloud}%) form a rich golden-hour canvas`)
    } else {
      notes.push(`Excellent cloud canvas (${combinedCanvas.toFixed(0)}% avg) structure for vibrant colors`)
    }
  } else if (totalCloud <= 20 && visKm >= 12) {
    score += 25
    notes.push(`Crystal-clear skies with excellent visibility (${visKm.toFixed(1)} km) suit a clean gradient sunset`)
  } else if (maxUpper >= 15 || combinedCanvas >= 12) {
    score += 18
    notes.push(`Promising mid/high cloud patches (${maxUpper}% max upper cloud)`)
  } else if (combinedCanvas >= 5) {
    score += 10
    notes.push(`Light mid/high cloud cover (${combinedCanvas.toFixed(0)}%)`)
  } else {
    notes.push(`Minimal upper cloud canvas (${combinedCanvas.toFixed(0)}%)`)
  }

  if (lowCloud <= 30 && totalCloud >= 25) {
    score += 10
    notes.push(`Productive sky coverage (${totalCloud}%) without heavy low overcast`)
  } else if (totalCloud < 25 && lowCloud <= 25) {
    score += 6
    notes.push(`Sparse total cloud cover (${totalCloud}%) leaves mostly open sky`)
  } else if (lowCloud <= 50) {
    score += 4
    notes.push(`Moderate cloud cover (${totalCloud}%) with partial horizon clearance`)
  } else {
    score += 1
    notes.push(`Heavy total cloud cover (${totalCloud}%) with risk of overcast`)
  }

  if (lowCloud <= 25) {
    score += 20
    notes.push(`Light low clouds (${lowCloud}%), keeping the horizon clear for direct sun rays`)
  } else if (lowCloud <= 55) {
    score += 10
    notes.push(`Moderate low clouds (${lowCloud}%) may partially filter horizon light`)
  } else {
    notes.push(`Heavy low clouds (${lowCloud}%) likely block the horizon sunbeam`)
  }

  if (humidity >= 25 && humidity <= 55) {
    score += 10
    notes.push(`Optimal humidity (${humidity}%) for crisp, vivid twilight hues`)
  } else if (visKm >= 12 && humidity <= 82) {
    score += 8
    notes.push(`High coastal air clarity (${visKm.toFixed(1)} km vis) balances moisture (${humidity}% RH)`)
  } else if (humidity < 25) {
    score += 7
    notes.push(`Dry air (${humidity}%) offers crisp horizon visibility`)
  } else {
    const humidityScore = Math.max(0, Math.round(10 * (95 - humidity) / 40))
    score += humidityScore
    notes.push(`High atmospheric humidity (${humidity}%) may add haze`)
  }

  if (visKm >= 15) {
    score += 10
    notes.push(`Excellent atmospheric visibility (${visKm.toFixed(1)} km)`)
  } else if (visKm >= 8) {
    score += 6
    notes.push(`Moderate visibility (${visKm.toFixed(1)} km)`)
  } else {
    notes.push(`Reduced visibility (${visKm.toFixed(1)} km)`)
  }

  if (tempC >= 15 && tempC <= 25) {
    score += 15
    notes.push(`Optimal temperature (${tempC.toFixed(1)}°C) for vibrant sunset colors`)
  } else if ((tempC >= 10 && tempC < 15) || (tempC > 25 && tempC <= 30)) {
    score += 10
    notes.push(`Good temperature (${tempC.toFixed(1)}°C) for sunset color development`)
  } else {
    notes.push(`Temperature (${tempC.toFixed(1)}°C) may affect color intensity`)
  }

  let normalized = Math.round((score / MAX_POSITIVE_SCORE) * 100)

  if (precipProb >= 50) {
    normalized -= 15
    notes.push(`High precipitation chance (${precipProb}%) reduces sunset visibility`)
  } else if (precipProb >= 30) {
    normalized -= 8
    notes.push(`Possible scattered rain (${precipProb}%) may mute sunset colors`)
  }

  return { score: Math.max(0, Math.min(100, normalized)), notes }
}

export async function fetchScore(lat, lon, eventType = 'sunset', date = null) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m,visibility,precipitation_probability,temperature_2m',
    daily: 'sunset,sunrise',
    timezone: 'auto',
    forecast_days: '7',
  })

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`)
  const data = await response.json()

  const events = data.daily?.[eventType] || []
  if (!events.length) throw new Error(`No ${eventType} data available`)

  let eventIso
  let isToday = false

  if (date) {
    const targetDate = date
    eventIso = events.find((iso) => iso.startsWith(targetDate))
    if (!eventIso) throw new Error(`No ${eventType} data available for ${targetDate}`)
  } else {
    const now = Date.now() / 1000 + (data.utc_offset_seconds || 0)
    const todayEvent = new Date(events[0]).getTime() / 1000
    isToday = now <= todayEvent + 7200
    eventIso = isToday ? events[0] : (events[1] || events[0])
  }

  const idx = findEventIndex(data.hourly.time || [], eventIso)
  const { score, notes } = scoreSunset(data.hourly, idx)

  return {
    lat,
    lon,
    event: eventType,
    event_time: formatEventTime(eventIso, data.utc_offset_seconds || 0),
    event_date: formatEventDate(eventIso),
    is_today: isToday,
    score,
    notes,
    forecast: buildFiveDayForecast(data, eventIso, eventType),
    cached: false,
  }
}
