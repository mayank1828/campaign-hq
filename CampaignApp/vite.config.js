import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.', // Explicitly set root to current directory
  build: {
    outDir: 'dist',
  }
})
