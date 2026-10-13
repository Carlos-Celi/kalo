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
  // Se preparan al arrancar: el SDK de IA se carga bajo demanda y, si Vite lo
  // descubriera a mitad de sesión, recargaría la página en plena configuración.
  optimizeDeps: {
    include: ['@anthropic-ai/sdk', '@anthropic-ai/sdk/helpers/zod', 'zod'],
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
    // Cada prueba monta la app completa y varias corren a la vez: un margen
    // evita falsos fallos por carga de la máquina.
    testTimeout: 20_000,
    // Las pruebas no dependen del .env.local de cada quien: sin Supabase.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
      VITE_TURNSTILE_SITE_KEY: '',
    },
  },
})
