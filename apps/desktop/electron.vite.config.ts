import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

const coreSrc = resolve(__dirname, '../../packages/core/src')
const templateRuntimeSrc = resolve(__dirname, '../../packages/template-runtime/src')
const betterSqliteShim = resolve(__dirname, 'electron/shims/better-sqlite3.ts')

const templatesSrc = resolve(__dirname, '../../templates')

// Order matters: more specific paths must come before their prefix
const workspaceAliases = [
  { find: '@card-draft/core/db/schema', replacement: resolve(coreSrc, 'db/schema.ts') },
  { find: '@card-draft/core/types', replacement: resolve(coreSrc, 'types/index.ts') },
  { find: '@card-draft/core/export/png', replacement: resolve(coreSrc, 'export/png.ts') },
  { find: '@card-draft/core/export/pdf', replacement: resolve(coreSrc, 'export/pdf.ts') },
  { find: '@card-draft/core/importer/mse-set', replacement: resolve(coreSrc, 'importer/mse-set.ts') },
  { find: '@card-draft/core', replacement: resolve(coreSrc, 'index.ts') },
  { find: '@card-draft/template-runtime/manifest', replacement: resolve(templateRuntimeSrc, 'manifest.ts') },
  { find: '@card-draft/template-runtime', replacement: resolve(templateRuntimeSrc, 'index.ts') },
  { find: 'better-sqlite3', replacement: betterSqliteShim },
]

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/main.ts'),
      },
      rollupOptions: {
        external: ['electron'],
        output: {
          format: 'es',
        },
      },
    },
    resolve: {
      alias: [{ find: '@', replacement: resolve(__dirname, 'electron') }, ...workspaceAliases],
    },
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts'),
      },
      rollupOptions: {
        external: ['electron'],
        output: {
          format: 'es',
        },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src'),
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/index.html'),
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: resolve(__dirname, 'src') },
        // Templates accessed by the renderer (aliased so dynamic imports resolve)
        { find: '@card-draft/templates', replacement: templatesSrc },
        ...workspaceAliases,
      ],
    },
  },
})
