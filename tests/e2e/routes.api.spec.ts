import { expect, test } from '@playwright/test'
import { apiRoutes } from './route-inventory'

const acceptedStatuses = new Set([200, 201, 202, 204, 400, 401, 403, 404, 422, 500, 503])

const baseBodyByPath: Record<string, unknown> = {
  '/api/ai/audit': { source: 'playwright' },
  '/api/ai/chat': {
    messages: [{ role: 'user', content: 'healthcheck' }],
  },
  '/api/ai/chat/completions': {
    messages: [{ role: 'user', content: 'healthcheck' }],
  },
  '/api/ai/config-store': {
    activeProvider: 'lm-studio',
    providers: {},
  },
  '/api/ai/search': {
    query: 'status',
  },
  '/api/ai/test-connection': {
    provider: 'lm-studio',
    baseUrl: 'http://localhost:1234/v1',
    port: 1234,
    token: '',
    apiKey: '',
    parameters: {
      model: 'local-model',
      temperature: 0.7,
      max_tokens: 128,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '/models/load',
      download: '/models/download',
      status: '/models/download/status/:job_id',
    },
    timeout: 30000,
    additionalParams: '',
  },
}

test.describe('API route inventory', () => {
  for (const route of apiRoutes) {
    for (const method of route.methods) {
      test(`${method} ${route.path}`, async ({ request }) => {
        let response

        if (method === 'GET') {
          response = await request.get(route.path)
        } else if (method === 'POST') {
          response = await request.post(route.path, {
            data: baseBodyByPath[route.path] ?? {},
          })
        } else if (method === 'PUT') {
          response = await request.put(route.path, {
            data: baseBodyByPath[route.path] ?? {},
          })
        } else if (method === 'DELETE') {
          response = await request.delete(route.path)
        } else {
          response = await request.fetch(route.path, {
            method,
            data: baseBodyByPath[route.path] ?? {},
          })
        }

        expect(acceptedStatuses.has(response.status())).toBeTruthy()
      })
    }
  }
})
