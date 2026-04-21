import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./app', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@@': fileURLToPath(new URL('.', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    exclude: [
      '.nuxt/**',
      '.output/**',
      'dist/**',
      'e2e/**',
      'node_modules/**',
    ],
    coverage: {
      exclude: [
        '.nuxt/**',
        '.output/**',
        'e2e/**',
        'node_modules/**',
        'test/**',
        'vitest.config.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'html'],
    },
    css: false,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
})
