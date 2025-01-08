
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "./style.css"
import AuthProvider from './Components/Navbar/AuthProvider.jsx'


createRoot(document.getElementById('root')).render(
  //Test2
  <StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </StrictMode>,
)
