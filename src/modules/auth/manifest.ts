import type { AppModuleManifest } from '@/modules/core/types'

export const authModule: AppModuleManifest = {
  id: 'auth',
  title: 'Authentication',
  description: 'Unified sign-in flows, local auth runtime, and identity entry points.',
  routes: [
    { path: '/auth', kind: 'page' },
    { path: '/api/auth/$', kind: 'api' },
  ],
}
