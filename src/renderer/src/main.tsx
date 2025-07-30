import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { NavigationProvider } from './contexts/NavigationContext'
import { ProfilesProvider } from './contexts/ProfilesContext'

console.log('Main.tsx loading')
console.log('window.api:', window.api)
console.log('window.electron:', window.electron)

// Check if running in Electron environment
if (!window.api) {
  console.error('window.api is not available - this app must run in Electron')
  document.body.innerHTML = `
    <div style="
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      background: #0f0f23; 
      color: #e2e8f0; 
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 2rem;
    ">
      <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #ef4444;">OpenCook Desktop Required</h1>
      <p style="font-size: 1.125rem; margin-bottom: 2rem; max-width: 500px; line-height: 1.5;">
        This application requires the OpenCook desktop environment to function properly. 
        Please run this application through the OpenCook desktop app.
      </p>
      <p style="font-size: 1rem; color: #94a3b8;">
        If you're seeing this message in the desktop app, please restart the application.
      </p>
    </div>
  `
  throw new Error('window.api is not available - application cannot function without Electron IPC')
}

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="color: red;">Root element not found!</div>'
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="opencook-ui-theme">
        <NavigationProvider>
          <ProfilesProvider>
            <App />
          </ProfilesProvider>
        </NavigationProvider>
      </ThemeProvider>
    </StrictMode>
  )
}
