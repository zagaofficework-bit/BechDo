import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './features/common/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';  // ← add this


createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <HelmetProvider>
    <App />
    </HelmetProvider>
  </ErrorBoundary>,
)
