import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' // 👈 IMPORTAR ESTO

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* 👈 ENVOLVER LA APP AQUÍ */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)