import { useState } from 'react'
import { useApp } from '../context/useApp'
import './Settings.css'

function Settings() {
  const { event, chooseEvent, location, placeName, fetchScore, savedSpots, removeSpot } = useApp()
  const [refreshing, setRefreshing] = useState(false)
  const [cleared, setCleared] = useState(false)

  const refreshForecast = async () => {
    if (!location) return
    setRefreshing(true)
    await fetchScore(location, event)
    setRefreshing(false)
  }

  const clearSavedSpots = () => {
    savedSpots.forEach((spot) => removeSpot(spot))
    setCleared(true)
    window.setTimeout(() => setCleared(false), 2500)
  }

  return (
    <main className="page-shell">
      <div className="page-heading"><p className="eyebrow">Noki preferences</p><h1>Settings.</h1></div>

      <section className="settings-panel">
        <div className="settings-section">
          <p className="meta-label">Default sky event</p>
          <strong>Which outlook opens first</strong>
          <div className="settings-choice-row">
            <button type="button" className={event === 'sunset' ? 'is-active' : ''} onClick={() => chooseEvent('sunset')}>Sunset</button>
            <button type="button" className={event === 'sunrise' ? 'is-active' : ''} onClick={() => chooseEvent('sunrise')}>Sunrise</button>
          </div>
          <span>Saved automatically and used whenever the app starts.</span>
        </div>

        <div className="settings-section">
          <p className="meta-label">Current location</p>
          <strong>{placeName || (location ? 'Unnamed location' : 'No location set')}</strong>
          {location && (
            <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
          )}
          <button type="button" className="settings-action" onClick={refreshForecast} disabled={!location || refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh forecast'}
          </button>
        </div>

        <div className="settings-section">
          <p className="meta-label">Saved spots</p>
          <strong>{savedSpots.length} saved</strong>
          {savedSpots.length > 0 && (
            <>
              <ul className="settings-spot-list">
                {savedSpots.map((spot) => (
                  <li key={`${spot.latitude}:${spot.longitude}:${spot.event}`}>
                    <span>{spot.placeName}</span>
                    <small>{spot.event}</small>
                  </li>
                ))}
              </ul>
              <button type="button" className="settings-action is-danger" onClick={clearSavedSpots}>Clear all saved spots</button>
              {cleared && <span>All saved spots removed.</span>}
            </>
          )}
          {savedSpots.length === 0 && <span>Nothing saved yet. Star a spot on Home to keep it here.</span>}
        </div>

        <div className="settings-section">
          <p className="meta-label">About Noki</p>
          <strong>Read the sky before you step outside.</strong>
          <span>Noki turns cloud layers, visibility, humidity, and precipitation into a simple outlook for the next sunrise or sunset.</span>
          <span className="privacy-note">
            <b>Private by design.</b> No accounts, no tracking, no data collection. Everything
            stays on your device; weather requests go straight to the forecast provider.
          </span>
          <span>Made by Jazzy (Rayan Ait Jilali)- September version
            
          </span>
        </div>
      </section>
    </main>
  )
}

export default Settings
