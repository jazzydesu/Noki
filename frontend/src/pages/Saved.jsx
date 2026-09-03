import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchScore as fetchScoreFromApi } from '../scorer'
import { useApp } from '../context/useApp'
import Icon from '../components/Icons'
import './Saved.css'

function Saved() {
  const { savedSpots, removeSpot, loadSavedSpot } = useApp()
  const [scores, setScores] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function loadScores() {
      const next = {}
      for (const spot of savedSpots) {
        const key = `${spot.latitude}:${spot.longitude}:${spot.event}`
        try {
          const data = await fetchScoreFromApi(spot.latitude, spot.longitude, spot.event)
          next[key] = data.score
        } catch (error) {
          console.error('Unable to refresh saved spot score', error)
        }
      }
      if (!cancelled) setScores(next)
    }
    loadScores()
    return () => { cancelled = true }
  }, [savedSpots])

  const openSpot = (spot) => {
    loadSavedSpot(spot)
    navigate('/')
  }

  return (
    <main className="page-shell">
      <div className="page-heading"><p className="eyebrow">Your collection</p><h1>Saved spots.</h1></div>
      {savedSpots.length === 0 ? (
          <section className="empty-panel"><span className="empty-icon"><Icon name="saved" size={30} /></span><h2>No saved spots yet.</h2><p>Save a location from Home to keep its sunrise or sunset close.</p></section>
      ) : (
        <div className="saved-list">
          {savedSpots.map((spot, index) => {
            const key = `${spot.latitude}:${spot.longitude}:${spot.event}`
            return (
              <article className="saved-row" key={key} style={{ '--item-index': index }}>
                <button type="button" className="saved-open" onClick={() => openSpot(spot)}>
                  <span className="saved-event-icon"><Icon name={spot.event === 'sunrise' ? 'forecast' : 'home'} size={18} /></span>
                  <span><strong>{spot.placeName}</strong><small>{spot.event}</small></span>
                  <span className="saved-score-badge" style={{ '--badge-tone': scores[key] ?? 0 }}>{scores[key] ?? '...'}</span>
                </button>
                <button type="button" className="saved-remove" onClick={() => removeSpot(spot)} aria-label={`Remove ${spot.placeName}`}><Icon name="close" size={18} /></button>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default Saved
