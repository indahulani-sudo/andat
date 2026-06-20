import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('leaflet')) return 'leaflet'
          if (id.includes('recharts') || id.includes('d3-')) return 'recharts'
        },
      },
    },
  },
})
