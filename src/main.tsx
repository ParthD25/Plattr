import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* Vercel Web Analytics: page views only, only when served by Vercel, and never on the health pages */}
    <Analytics beforeSend={e => (/^\/(profile|trends)(\/|$)/.test(new URL(e.url).pathname) ? null : e)} />
  </StrictMode>,
)
