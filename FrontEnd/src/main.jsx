
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "./style.css"


createRoot(document.getElementById('root')).render(
  //Test2
  <StrictMode>
    <App />
  </StrictMode>,
)
