import { fileURLToPath, URL } from 'node:url'
// import netlify from '@netlify/vite-plugin-tanstack-start'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST

const config = defineConfig({
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    deps: {
      optimizer: {
        web: {
          include: ['react', 'react-dom'],
        },
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'use-sync-external-store/shim/with-selector.js': fileURLToPath(
        new URL('./src/shared/lib/shim-with-selector.ts', import.meta.url),
      ),
      'use-sync-external-store/shim/with-selector': fileURLToPath(
        new URL('./src/shared/lib/shim-with-selector.ts', import.meta.url),
      ),
      'use-sync-external-store/shim/index.js': fileURLToPath(
        new URL('./src/shared/lib/shim.ts', import.meta.url),
      ),
      'use-sync-external-store/shim': fileURLToPath(
        new URL('./src/shared/lib/shim.ts', import.meta.url),
      ),
    },
  },
  plugins: [
    devtools(),
    tailwindcss(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    !isTest && tanstackStart(),
    viteReact(),
    // netlify(),
  ].filter(Boolean),
})

export default config
