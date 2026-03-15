import { IconSearch } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const aiModule: AppModuleManifest = {
  id: 'ai',
  title: 'AI Workspace',
  description: 'AI assistants, provider integrations, audit endpoints, and workspace search.',
  routes: [
    { path: '/api/ai/audit', kind: 'api' },
    { path: '/api/ai/chat', kind: 'api' },
    { path: '/api/ai/chat/completions', kind: 'api' },
    { path: '/api/ai/config-store', kind: 'api' },
    { path: '/api/ai/models', kind: 'api' },
    { path: '/api/ai/search', kind: 'api' },
    { path: '/api/ai/status', kind: 'api' },
    { path: '/api/ai/test-connection', kind: 'api' },
  ],
  navigation: [
    {
      id: 'core',
      title: 'Core',
      kind: 'main',
      order: 10,
      items: [
        {
          id: 'ai-search',
          titleKey: 'sidebar.secondary.search',
          fallbackTitle: 'Search',
          action: 'open-ai-search',
          icon: IconSearch,
          order: 10,
        },
      ],
    },
  ],
}
