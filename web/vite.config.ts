import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Dentro del contenedor de desarrollo (docker-compose.yml) los cambios del
// código montado no siempre emiten eventos de archivo: se vigila por sondeo.
const enDocker = process.env.KALO_DOCKER === '1'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: enDocker ? '0.0.0.0' : 'localhost',
    port: 5173,
    strictPort: true,
    watch: enDocker ? { usePolling: true, interval: 300 } : undefined,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    sourcemap: false,
    // Nada incrustado como data: URI, para que la CSP pueda exigir 'self'.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Las pruebas no dependen del .env.local de cada quien: sin Supabase.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
      VITE_TURNSTILE_SITE_KEY: '',
    },
  },
})
