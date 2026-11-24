import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initI18n } from './i18n.js'

initI18n()

// Install-as-app: keep the browser's install prompt so the in-app "Install" button can use it
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__abaaInstallPrompt = e
  window.dispatchEvent(new Event('abaa-install-ready'))
})
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
