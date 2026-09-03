import { Link } from 'react-router-dom'
import LocationPicker from '../LocationPicker'
import EventToggle from '../components/EventToggle'
import ScoreMark from '../components/ScoreMark'
import Icon from '../components/Icons'
import { useApp } from '../context/useApp'
import './Home.css'

function EventChooser() {
  const { chooseEvent, eventChooserOpen } = useApp()
  if (!eventChooserOpen) return null

  return (
    <div className="event-chooser-backdrop">
      <section className="event-chooser" role="dialog" aria-modal="true" aria-labelledby="event-chooser-title">
        <p className="eyebrow">One last choice</p>
        <h2 id="event-chooser-title">Rate the sunset or sunrise?</h2>
        <div className="event-choice-list">
          <button type="button" onClick={() => chooseEvent('sunset')}><span>Sunset</span><small>Warmth after the day</small></button>
          <button type="button" onClick={() => chooseEvent('sunrise')}><span>Sunrise</span><small>Color at first light</small></button>
        </div>
      </section>
    </div>
  )
}

function Notes({ notes }) {
  return (
    <div className="notes-block">
      <p className="meta-label">What the sky is saying</p>
      <ul className="notes-list">
        {notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
    </div>
  )
}

function WeekPreview({ forecast }) {
  if (!forecast || forecast.length === 0) return null
  const best = forecast.reduce((a, b) => (b.score > a.score ? b : a))
  const width = 300
  const height = 56
  const points = forecast.map((item, index) => {
    const x = forecast.length === 1 ? width / 2 : (index * width) / (forecast.length - 1)
    const y = height - (item.score / 100) * 40 - 6
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="week-preview">
      <div className="week-preview-head">
        <p className="meta-label">This week</p>
        <Link to="/forecast" className="week-preview-link">Full forecast</Link>
      </div>
      {best.score >= 60 && (
        <p className="best-day-callout">
          {best.day_name} looks best at <b>{best.score}</b>
        </p>
      )}
      <svg className="week-spark" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Five-day score trend">
        <polyline points={points} />
        {forecast.map((item, index) => {
          const [x, y] = points.split(' ')[index].split(',')
          return <circle key={item.sunset_iso} cx={x} cy={y} r="2.5" />
        })}
      </svg>
      <div className="week-chips">
        {forecast.slice(0, 3).map((item) => (
          <Link to="/forecast" className="week-chip" key={item.sunset_iso}>
            <span>{item.day_name}</span>
            <b style={{ '--chip-tone': item.score }}>{item.score}</b>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Home() {
  const { event, result, status, message, placeName, pickerOpen, setPickerOpen, selectLocation, requestLocation, saveSpot, savedSpots } = useApp()
  const saved = result && savedSpots.some((spot) => spot.latitude === result.lat && spot.longitude === result.lon && spot.event === event)
  const scoreTone = result ? Math.min(100, Math.max(0, result.score)) : 20

  return (
    <main className="app-shell" style={{ '--score-tone': scoreTone }}>
      <header className="topline">
        <span className="brand-mark"><span /> Noki</span>
        <div className="home-actions">
          <button type="button" className="location-display" onClick={() => setPickerOpen(true)} aria-label="Change location">
            {placeName || 'Choose location'}
          </button>
          {result && <button type="button" className={`save-button ${saved ? 'is-saved' : ''}`} onClick={saveSpot} aria-label={saved ? 'Spot saved' : 'Save this spot'}><Icon name="saved" /></button>}
        </div>
      </header>

      {status === 'success' && result && (
        <section className="result-panel" aria-live="polite">
          <div className="result-heading">
            <div>
              <p className="eyebrow">{result.is_today ? `Today's ${event}` : `Tomorrow's ${event}`}</p>
              <h1>Catch the color.</h1>
            </div>
          </div>
          <EventToggle />
          <ScoreMark score={result.score} event={event} />
          <div className="sunset-time">
            <span className="sun-icon" aria-hidden="true" />
            <div>
              <span className="sunset-date">{result.event_date} · {event === 'sunrise' ? 'Sunrise' : 'Sunset'} at</span>
              <strong>{result.event_time}</strong>
            </div>
          </div>
          <Notes notes={result.notes} />
          <WeekPreview forecast={result.forecast} />
        </section>
      )}

      {(status === 'locating' || status === 'loading') && (
        <section className="status-panel" aria-live="polite">
          <span className="loading-sun" aria-hidden="true" />
          <p className="eyebrow">Looking up your sky</p>
          <h1>{status === 'locating' ? 'Finding your location...' : 'Checking the sky...'}</h1>
          <p className="status-copy">{status === 'locating' ? 'Allow location access to get a forecast for where you are.' : 'Pulling the latest cloud, humidity, and visibility data.'}</p>
          <button type="button" className="manual-entry-button" onClick={() => setPickerOpen(true)}>
            Pick a place manually
          </button>
        </section>
      )}

      {status === 'error' && (
        <section className="status-panel error-panel" aria-live="assertive">
          <span className="error-sun" aria-hidden="true">!</span>
          <p className="eyebrow">A small cloud in the way</p>
          <h1>We missed your sky.</h1>
          <p className="status-copy">{message}</p>
          <div className="error-actions">
            <button type="button" className="retry-button" onClick={requestLocation}>Try again</button>
            <button type="button" className="manual-entry-button" onClick={() => setPickerOpen(true)}>Pick a place manually</button>
          </div>
        </section>
      )}

      <LocationPicker isOpen={pickerOpen} placeName={placeName} onLocationSelect={(coords) => selectLocation(coords, true)} onRequestGps={requestLocation} onClose={() => setPickerOpen(false)} />
      <EventChooser />
    </main>
  )
}

export default Home
