import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Home from './Pages/Home.jsx'
import AppRoutes from './routes.jsx'
import './app.css'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
)
