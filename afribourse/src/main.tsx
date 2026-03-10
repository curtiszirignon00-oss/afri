// src/main.tsx
// Sentry MUST be initialized before any other imports
import * as Sentry from '@sentry/react'

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    release: `afribourse-frontend@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Send default PII (IP address, etc.)
    sendDefaultPii: true,
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  })
}

import * as amplitude from '@amplitude/unified'

amplitude.initAll('445eb89bf34759faaed0372e035fdbff', {
  serverZone: 'EU',
  analytics: { autocapture: true },
  sessionReplay: { sampleRate: 1 },
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