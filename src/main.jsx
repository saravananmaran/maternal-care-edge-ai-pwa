import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Register Workbox Service Worker for offline PWA functionality
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('A new version of MaternalCare Edge AI is available. Reload now?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.info('[PWA] MaternalCare Edge AI is ready to work completely offline.')
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
