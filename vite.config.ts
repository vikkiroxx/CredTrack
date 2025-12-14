import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'CredTrack',
        short_name: 'CredTrack',
        description: 'Personal Finance Tracker for Credit Cards and EMIs',
        theme_color: '#16a34a', // green-600
        icons: []
      }
    })
  ],
})
