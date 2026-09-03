const defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'
const apiHost = defaultHost === 'localhost' ? '127.0.0.1' : defaultHost

export const REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse'
export const LOCATION_STORAGE_KEY = 'sunset-score-location'
export const LOCATION_MAX_AGE_MS = 30 * 60 * 1000
