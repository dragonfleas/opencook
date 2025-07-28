import './assets/main.css'
import './lib/api-mock' // Temporary mock until IPC is connected

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { NavigationProvider } from './contexts/NavigationContext'

console.log('Main.tsx loading')

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
          <App />
        </NavigationProvider>
      </ThemeProvider>
    </StrictMode>
  )
}
