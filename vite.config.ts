
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    hmr: {
      port: 443,
      host: 'localhost'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: false
  }
})
