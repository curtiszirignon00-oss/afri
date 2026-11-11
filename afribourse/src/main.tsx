// src/main.tsx
// DOIT rester le premier import : polyfills + stockage de secours pour les vieux mobiles
import './lib/polyfills'
import * as amplitude from '@amplitude/unified'
import { claimAutoReload, markReloadScheduled } from './lib/chunkErrors'
import { installGlobalErrorHandlers } from './lib/errorReporter'
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

// Erreurs JS non gérées (hors rendu React) → remontées au dashboard admin
installGlobalErrorHandlers()

// Après un deploy, un onglet ouvert référence d'anciens chunks qui n'existent
// plus : Vite émet vite:preloadError avant même que React ne voie l'erreur.
// On recharge une fois (anti-boucle 30 s partagée avec lazyWithRetry et l'ErrorBoundary).
window.addEventListener('vite:preloadError', (event) => {
  if (!claimAutoReload()) return
  // Attention : preventDefault() fait résoudre l'import() à undefined au lieu de rejeter.
  // lazyWithRetry le détecte (isReloadScheduled) et garde le fallback Suspense jusqu'au reload.
  markReloadScheduled()
  event.preventDefault()
  window.location.reload()
})

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