import { useState } from 'react'
import LocationPicker from '../LocationPicker'
import Icon from '../components/Icons'
import Tutorial from '../components/Tutorial'
import { hasSeenTutorial } from '../components/tutorialStorage'
import { useApp } from '../context/useApp'
import './Welcome.css'

function Welcome() {
  const { requestLocation, setPickerOpen, pickerOpen, selectLocation, status, message, dismissWelcome } = useApp()
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial())
  const locating = status === 'locating'
  const denied = status === 'error'

  return (
    <main className="welcome-shell">
      {showTutorial && <Tutorial onDone={() => setShowTutorial(false)} />}

      <div className="welcome-disc" aria-hidden="true"><span /></div>
      <p className="eyebrow">Welcome to Noki</p>
      <h1>Read the sky before you step outside.</h1>
      <p className="welcome-copy">
        Noki turns clouds, humidity, and visibility into a simple score for the next
        sunset or sunrise where you are.
      </p>

      {denied && (
        <p className="welcome-error">
          {message || 'Location access was blocked.'} You can still pick a place manually.
        </p>
      )}

      <div className="welcome-actions">
        <button type="button" className="welcome-primary" onClick={requestLocation} disabled={locating}>
          <Icon name="pin" size={18} /> {locating ? 'Finding you...' : 'Use my location'}
        </button>
        <button type="button" className="welcome-secondary" onClick={() => setPickerOpen(true)}>
          Pick a place manually
        </button>
      </div>

      <ul className="welcome-points">
        <li><Icon name="clear" size={16} /> Scores for sunsets and sunrises</li>
        <li><Icon name="forecast" size={16} /> Five-day outlook with trends</li>
        <li><Icon name="saved" size={16} /> Private: no accounts, no data collection</li>
      </ul>

      <button type="button" className="welcome-skip" onClick={dismissWelcome}>Skip for now</button>

      <LocationPicker
        isOpen={pickerOpen}
        placeName={null}
        onLocationSelect={(coords) => selectLocation(coords, true)}
        onRequestGps={requestLocation}
        onClose={() => setPickerOpen(false)}
      />
    </main>
  )
}

export default Welcome
