import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../backend/certs/cert.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../backend/certs/cert.crt')),
    },
    proxy: {
      '/socket.io': {
        target: 'https://localhost:8181',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/api': {
        target: 'https://localhost:8181',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

