import { fileURLToPath, URL } from 'node:url'
// import netlify from '@netlify/vite-plugin-tanstack-start'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST
const isViteDevtoolsDisabled = process.env.DISABLE_TANSTACK_VITE_DEVTOOLS === 'true'

const config = defineConfig((configEnv) => {
  const shouldStubDbForClientBuild = configEnv.command === 'build' && !configEnv.isSsrBuild
  const streamWebShim = fileURLToPath(
    new URL('./src/shared/lib/node/stream-web.ts', import.meta.url),
  )

  return {
    server: {
      port: 3000,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
      include: [
        'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ],
      deps: {
        optimizer: {
          web: {
            include: ['react', 'react-dom'],
          },
        },
      },
    },
    resolve: {
      tsconfigPaths: true,
      dedupe: ['react', 'react-dom'],
      alias: [
        ...(shouldStubDbForClientBuild
          ? [
              {
                find: /^@\/shared\/lib\/db$/,
                replacement: fileURLToPath(
                  new URL('./src/shared/lib/db/browser.ts', import.meta.url),
                ),
              },
            ]
          : []),
        ...(configEnv.isSsrBuild
          ? [
              {
                find: /^stream\/web$/,
                replacement: streamWebShim,
              },
              {
                find: /^stream-browserify\/web$/,
                replacement: streamWebShim,
              },
            ]
          : []),
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
        {
          find: 'use-sync-external-store/shim/with-selector.js',
          replacement: fileURLToPath(
            new URL('./src/shared/lib/shim-with-selector.ts', import.meta.url),
          ),
        },
        {
          find: 'use-sync-external-store/shim/with-selector',
          replacement: fileURLToPath(
            new URL('./src/shared/lib/shim-with-selector.ts', import.meta.url),
          ),
        },
        {
          find: 'use-sync-external-store/shim/index.js',
          replacement: fileURLToPath(new URL('./src/shared/lib/shim.ts', import.meta.url)),
        },
        {
          find: 'use-sync-external-store/shim',
          replacement: fileURLToPath(new URL('./src/shared/lib/shim.ts', import.meta.url)),
        },
      ],
    },
    ssr: {
      external: ['xlsx', 'pdf-parse'],
    },
    plugins: [
      !isViteDevtoolsDisabled && devtools(),
      tailwindcss(),
      !isTest &&
        tanstackStart({
          srcDirectory: './src',
          router: {
            routeToken: 'route',
          },
        }),
      viteReact(),
      // netlify(),
    ].filter(Boolean),
  }
})

export default config
