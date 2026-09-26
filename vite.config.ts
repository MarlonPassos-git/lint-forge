/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.unit.spec.{ts,tsx}', 'src/**/*.integration.spec.{ts,tsx}'],
    setupFiles: './src/test/setup.ts',
  },
})
