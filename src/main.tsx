import 'reflect-metadata'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { unstableSetCreateRoot } from '@flowgram.ai/form-materials'
import App from './App.tsx'
import './App.css'

// React 18/19 polyfill for FlowGram form-materials
unstableSetCreateRoot(createRoot)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
