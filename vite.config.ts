
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Worker bundling configuration
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
  /*
    // Development server with COOP/COEP headers for SharedArrayBuffer
    // Using 'credentialless' for COEP to allow cross-origin resources (Tailwind CDN, Google Fonts)
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
    },
  
    // Preview server (production build preview)
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
    },
  */
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
