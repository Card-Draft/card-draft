import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@card-draft/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      '@card-draft/core/mana': fileURLToPath(new URL('../../packages/core/src/mana.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['out/**', 'dist/**', 'node_modules/**'],
  },
})
