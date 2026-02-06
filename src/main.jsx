import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './context/AppContext'
import SplashScreen from './components/screens/SplashScreen'
import './index.css'

// Root wraps the entire app and shows the splash video once per session.
// sessionStorage is used so the video only plays once per browser tab —
// refreshing the page won't replay it, but opening a new tab will.

function Root() {
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('sanctuary_splash_done') === 'true'
  )

  function handleSplashComplete() {
    sessionStorage.setItem('sanctuary_splash_done', 'true')
    setSplashDone(true)
  }

  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
