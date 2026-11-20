import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ClientDashboard from './views/ClientDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClientDashboard />

  </StrictMode>,
)
