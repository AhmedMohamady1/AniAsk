import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'https://aniask.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/anime': {
        target: 'https://aniask.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/tracking': {
        target: 'https://aniask.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})

