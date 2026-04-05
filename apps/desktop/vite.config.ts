import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  // Use the web app's src directly – no duplication
  root: resolve(__dirname, '../web'),
  // Output to desktop's dist so electron-builder picks it up
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@todo/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@todo/store': resolve(__dirname, '../../packages/store/src/index.ts'),
    },
  },
  // Make Vite inject the env vars from desktop's .env
  envDir: __dirname,
  base: './',
})
