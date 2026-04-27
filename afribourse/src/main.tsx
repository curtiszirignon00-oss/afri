// src/main.tsx
import * as amplitude from '@amplitude/unified'
import { captureUTMParams } from './lib/amplitude'
import { applyTranslateSurvivalPatch } from './lib/translateSurvivalPatch'

// DOIT être appliqué avant tout rendu React, sinon les traducteurs mobiles
// (Chrome, Samsung Internet, Edge) cassent le diff et déclenchent l'ErrorBoundary
applyTranslateSurvivalPatch()

amplitude.initAll('445eb89bf34759faaed0372e035fdbff', {
  serverZone: 'EU',
  analytics: { autocapture: true },
  sessionReplay: { sampleRate: 1 },
})

captureUTMParams()

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/module-professional.css'
import App from './App'
import { initPushNotifications } from './services/pushNotifications'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Init push notifications (non-blocking)
initPushNotifications()

// Pré-charger le token CSRF dès le démarrage (non-bloquant)
import('./config/api').then(({ fetchCsrfToken }) => fetchCsrfToken())