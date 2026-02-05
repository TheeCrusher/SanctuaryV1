import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allows access from network (useful in Codespaces)
    proxy: {
      // Forward any request starting with /api to the Express backend
      // Example: fetch('/api/appointments') → http://localhost:3001/api/appointments
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
