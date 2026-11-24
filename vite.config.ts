import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Firebase's sign-in helper pages, served from the dev server's own origin (same as functions/_middleware.ts in production).
const firebaseHelper = { target: 'https://englitch-da50c.firebaseapp.com', changeOrigin: true, secure: true }

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/__/auth': firebaseHelper,
      '/__/firebase': firebaseHelper,
    },
  },
})
