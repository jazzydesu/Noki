import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EventToggle from '../components/EventToggle'
import Icon from '../components/Icons'
import LocationPicker from '../LocationPicker'
import { fetchScore as fetchScoreFromApi } from '../scorer'
import { useApp } from '../context/useApp'
import './Forecast.css'

function forecastIcon(score) {
  if (score >= 75) return 'clear'
  if (score >= 45) return 'partly'
  return 'overcast'
}

function ForecastTrend({ forecast }) {
  const width = 320
  const height = 72
  const points = forecast.map((item, index) => {
    const x = forecast.length === 1 ? width / 2 : (index * width) / (forecast.length - 1)
    const y = height - (item.score / 100) * 52 - 8
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="forecast-trend">
      <div className="trend-heading"><span className="meta-label">Week at a glance</span><span>{forecast[0].score} to {forecast[forecast.length - 1].score}</span></div>
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Five-day sunset score trend">
        <path className="trend-guide" d={`M0 ${height - 8}H${width}`} />
        <polyline points={points} />
        {forecast.map((item, index) => {
          const [x, y] = points.split(' ')[index].split(',')
          return <circle key={item.sunset_iso} cx={x} cy={y} r="3" />
        })}
      </svg>
    </div>
  )
}

function Forecast() {
  const { result, placeName, location, event, status, fetchScore, pickerOpen, setPickerOpen, requestLocation, selectLocation } = useApp()
  const forecast = result?.forecast || []
  const [selectedDate, setSelectedDate] = useState('')
  const [dateResult, setDateResult] = useState(null)
  const [dateLoading, setDateLoading] = useState(false)
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    if (!result && location) fetchScore(location, event)
  }, [result, location, event, fetchScore])

  const loading = (!result && location) || status === 'loading'

  const lookupDate = async () => {
    if (!selectedDate || !location) return
    setDateLoading(true)
    setDateError('')
    try {
      const data = await fetchScoreFromApi(location.latitude, location.longitude, event, selectedDate)
      setDateResult(data)
    } catch (error) {
      console.error('Unable to load date forecast', error)
      setDateResult(null)
      setDateError(error.message || 'Could not load that date.')
    } finally {
      setDateLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">{placeName || (location ? 'Your location' : 'No location yet')}</p>
        <h1>Five days of color.</h1>
        <EventToggle />
      </div>

      <div className="forecast-controls">
        <div className="forecast-location-row">
          <button type="button" className="forecast-control-button" onClick={requestLocation}>
            <Icon name="pin" size={16} /> Use current location
          </button>
          <button type="button" className="forecast-control-button" onClick={() => setPickerOpen(true)}>
            Choose location
          </button>
        </div>

        <div className="forecast-date-row">
          <label className="meta-label" htmlFor="forecast-date">Pick a date</label>
          <div className="date-input-row">
            <input
              id="forecast-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button type="button" className="forecast-control-button" onClick={lookupDate} disabled={!selectedDate || !location || dateLoading}>
              {dateLoading ? 'Checking...' : 'Check sky'}
            </button>
          </div>
        </div>
      </div>

      {dateResult && (
        <section className="date-result-panel">
          <p className="meta-label">{dateResult.event_date}</p>
          <strong>{dateResult.score}<small>/100</small></strong>
          <span>{dateResult.event_time} · {dateResult.notes[0]}</span>
        </section>
      )}
      {dateError && <p className="date-error">{dateError}</p>}
      {forecast.length > 0 ? (
        <>
          <ForecastTrend forecast={forecast} />
          <div className="forecast-detail-list">
          {forecast.map((item) => (
            <article className="forecast-detail-row" key={item.sunset_iso}>
              <div className="forecast-day-cell"><Icon name={forecastIcon(item.score)} size={24} /><span><strong>{item.day_name}</strong><span>{item.short_date}</span></span></div>
              <div className="detail-meter"><span style={{ width: `${item.score}%` }} /></div>
              <div className="detail-score"><b>{item.score}</b><span>{item.event_time}</span></div>
              <p>{item.summary}</p>
            </article>
          ))}
          </div>
        </>
      ) : loading ? (
        <section className="empty-panel"><h2>Reading the week's sky...</h2><p>Pulling five days of cloud, humidity, and visibility data.</p></section>
      ) : (
        <section className="empty-panel"><h2>No forecast loaded yet.</h2><p>Head home to load a location forecast.</p><Link to="/">Go to Home</Link></section>
      )}

      <LocationPicker isOpen={pickerOpen} placeName={placeName} onLocationSelect={(coords) => selectLocation(coords, true)} onRequestGps={requestLocation} onClose={() => setPickerOpen(false)} />
    </main>
  )
}

export default Forecast
