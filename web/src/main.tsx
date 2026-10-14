import '@fontsource-variable/onest'
import '@fontsource/saira-condensed/600.css'
import '@fontsource/saira-condensed/700.css'
import '@fontsource/saira-condensed/800.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './app/router'
import './theme/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
