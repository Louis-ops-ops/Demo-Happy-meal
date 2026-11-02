import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/lexend/300.css'
import '@fontsource/lexend/400.css'
import '@fontsource/lexend/500.css'
import '@fontsource/lexend/600.css'
import './styles/index.css'
import { App } from './App'
import { platform } from './platform'

if (platform.hasServiceWorker) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
