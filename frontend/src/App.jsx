import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/useApp'
import Forecast from './pages/Forecast'
import Home from './pages/Home'
import Saved from './pages/Saved'
import Settings from './pages/Settings'
import Welcome from './pages/Welcome'
import './App.css'

function AppFrame() {
  const { result, pickerOpen, eventChooserOpen, location, welcomeDismissed } = useApp()
  const routeLocation = useLocation()
  const scoreTone = result ? Math.min(100, Math.max(0, result.score)) : 20
  const needsWelcome = !location && !welcomeDismissed && routeLocation.pathname === '/'

  return (
    <div className="app-frame" style={{ '--score-tone': scoreTone }}>
      <div className="route-stage" key={routeLocation.pathname}>
        <Routes>
          <Route path="/" element={needsWelcome ? <Welcome /> : <Home />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!pickerOpen && !eventChooserOpen && <BottomNav />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppFrame />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
