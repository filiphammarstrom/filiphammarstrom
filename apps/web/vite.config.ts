import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@todo/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@todo/store': resolve(__dirname, '../../packages/store/src/index.ts'),
    },
  },
})
