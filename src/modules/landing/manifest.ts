import type { AppModuleManifest } from '@/modules/core/types'

export const landingModule: AppModuleManifest = {
  id: 'landing',
  title: 'Landing',
  description: 'Public marketing and entry routes for the template.',
  routes: [{ path: '/', kind: 'page' }],
}
