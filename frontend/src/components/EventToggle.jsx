import { useApp } from '../context/useApp'

function EventToggle() {
  const { event, chooseEvent } = useApp()

  return (
    <div className="event-toggle" role="group" aria-label="Choose sky event">
      <button type="button" className={event === 'sunset' ? 'is-active' : ''} onClick={() => chooseEvent('sunset')}>
        Sunset
      </button>
      <button type="button" className={event === 'sunrise' ? 'is-active' : ''} onClick={() => chooseEvent('sunrise')}>
        Sunrise
      </button>
    </div>
  )
}

export default EventToggle
