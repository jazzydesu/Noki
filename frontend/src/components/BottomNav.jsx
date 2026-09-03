import { NavLink } from 'react-router-dom'
import Icon from './Icons'

const tabs = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/forecast', label: 'Forecast', icon: 'forecast' },
  { to: '/saved', label: 'Saved', icon: 'saved' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => isActive ? 'is-active' : ''}>
          <span className="bottom-nav-icon"><Icon name={tab.icon} /></span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav
