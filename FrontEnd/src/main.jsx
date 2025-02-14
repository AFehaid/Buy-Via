
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "./style.css"
import AuthProvider from './contexts/AuthProvider.jsx'


createRoot(document.getElementById('root')).render(
  //Test2
    <AuthProvider>
    <App />
    </AuthProvider>
)
  