import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Single-page demo app: all routes ship in one chunk on purpose, so the
  // chunk-size advisory limit is raised instead of code-splitting.
  build: { chunkSizeWarningLimit: 650 },
})
