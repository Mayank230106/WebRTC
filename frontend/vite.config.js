import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'https://localhost:8181',
        ws: true,
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'https://localhost:8181',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
