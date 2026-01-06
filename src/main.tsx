import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FlowWrapper } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlowWrapper />
  </StrictMode>,
)
