export interface UiRouteInventoryItem {
  path: string
  module: string
  authRequired: boolean
  nestedUnder?: string
  redirectTo?: string
  params: string[]
}

export interface ApiRouteInventoryItem {
  path: string
  module: string
  methods: Array<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>
  params: string[]
}

export const uiRoutes: UiRouteInventoryItem[] = [
  {
    path: '/',
    module: 'landing',
    authRequired: false,
    params: [],
  },
  {
    path: '/dashboard',
    module: 'dashboard',
    authRequired: true,
    nestedUnder: '/dashboard',
    params: [],
  },
  {
    path: '/dashboard/analytics',
    module: 'analytics',
    authRequired: true,
    nestedUnder: '/dashboard',
    params: [],
  },
  {
    path: '/dashboard/categories',
    module: 'categories',
    authRequired: true,
    nestedUnder: '/dashboard',
    params: [],
  },
  {
    path: '/dashboard/help',
    module: 'ai-help',
    authRequired: true,
    nestedUnder: '/dashboard',
    params: [],
  },
  {
    path: '/dashboard/projects',
    module: 'projects',
    authRequired: true,
    nestedUnder: '/dashboard',
    params: [],
  },
  {
    path: '/dashboard/settings',
    module: 'settings',
    authRequired: true,
    nestedUnder: '/dashboard',
    redirectTo: '/dashboard/settings/system',
    params: [],
  },
  {
    path: '/dashboard/settings/system',
    module: 'settings-system',
    authRequired: true,
    nestedUnder: '/dashboard/settings',
    params: [],
  },
  {
    path: '/dashboard/settings/ia_config',
    module: 'settings-ai',
    authRequired: true,
    nestedUnder: '/dashboard/settings',
    params: [],
  },
  {
    path: '/dashboard/team',
    module: 'team',
    authRequired: true,
    nestedUnder: '/dashboard',
    params: [],
  },
  {
    path: '/dashboard/todos',
    module: 'todos',
    authRequired: true,
    nestedUnder: '/dashboard',
    params: [],
  },
  {
    path: '/dashboard/transactions',
    module: 'transactions',
    authRequired: true,
    nestedUnder: '/dashboard',
    params: [],
  },
  {
    path: '/dashboard/users',
    module: 'users',
    authRequired: true,
    nestedUnder: '/dashboard',
    params: [],
  },
]

export const apiRoutes: ApiRouteInventoryItem[] = [
  {
    path: '/api/ai/audit',
    module: 'ai-api',
    methods: ['GET', 'POST'],
    params: [],
  },
  {
    path: '/api/ai/chat',
    module: 'ai-api',
    methods: ['POST'],
    params: [],
  },
  {
    path: '/api/ai/chat/completions',
    module: 'ai-api',
    methods: ['POST'],
    params: [],
  },
  {
    path: '/api/ai/config-store',
    module: 'ai-api',
    methods: ['GET', 'POST', 'PUT'],
    params: [],
  },
  {
    path: '/api/ai/search',
    module: 'ai-api',
    methods: ['POST'],
    params: [],
  },
  {
    path: '/api/ai/status',
    module: 'ai-api',
    methods: ['GET'],
    params: [],
  },
  {
    path: '/api/ai/test-connection',
    module: 'ai-api',
    methods: ['POST'],
    params: [],
  },
]
