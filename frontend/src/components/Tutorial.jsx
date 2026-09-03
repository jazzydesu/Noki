import { useState } from 'react'
import Icon from './Icons'
import { markTutorialSeen } from './tutorialStorage'
import './Tutorial.css'

const slides = [
  {
    icon: 'clear',
    title: 'Your sky, scored',
    body: 'Noki rates the next sunset or sunrise from 0 to 100 using clouds, humidity, and visibility.',
  },
  {
    icon: 'forecast',
    title: 'Any place, any day',
    body: 'Search any location, browse a five-day outlook, or check a specific date.',
  },
  {
    icon: 'saved',
    title: 'Private by design',
    body: 'No accounts, no tracking, no servers with your data. Everything stays on your device.',
  },
]

function Tutorial({ onDone }) {
  const [index, setIndex] = useState(0)
  const slide = slides[index]
  const last = index === slides.length - 1

  const finish = () => {
    markTutorialSeen()
    onDone()
  }

  return (
    <div className="tutorial-backdrop">
      <section className="tutorial-card" role="dialog" aria-modal="true" aria-label="Getting started">
        <div className="tutorial-icon"><Icon name={slide.icon} size={30} /></div>
        <p className="eyebrow">{`Step ${index + 1} of ${slides.length}`}</p>
        <h2>{slide.title}</h2>
        <p className="tutorial-body">{slide.body}</p>

        <div className="tutorial-dots">
          {slides.map((_, i) => (
            <span key={i} className={i === index ? 'is-active' : ''} />
          ))}
        </div>

        <div className="tutorial-actions">
          {index > 0 && (
            <button type="button" className="tutorial-back" onClick={() => setIndex(index - 1)}>Back</button>
          )}
          <button type="button" className="tutorial-next" onClick={() => (last ? finish() : setIndex(index + 1))}>
            {last ? 'Get started' : 'Next'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default Tutorial
