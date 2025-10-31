// src/main.tsx - VERSION PROPRE
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './AppRefactored' // AppRefactored contient déjà QueryClientProvider

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)