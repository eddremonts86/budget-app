import { chat } from '@tanstack/ai'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logAudit } from '@/modules/ai/audit'
import { getActiveAiConfig, getAllAiConfigs, validateAiConfig } from '@/modules/ai/config/store'
import { detectBestProvider, probeProvider } from '@/modules/ai/providers'
import { Route } from '@/routes/api/ai/chat/route'

// Mock dependencies
vi.mock('@/modules/ai/config/store', () => ({
  getActiveAiConfig: vi.fn(),
  getAllAiConfigs: vi.fn(),
  validateAiConfig: vi.fn(),
}))
vi.mock('@/modules/ai/providers', () => ({
  detectBestProvider: vi.fn(),
  probeProvider: vi.fn(),
  discoverProviderModels: vi.fn(async (config) => ({
    models: [],
    resolvedModelId: config.parameters.model,
    source: 'configured',
  })),
  getProvider: vi.fn((id) => {
    if (id === 'openai') {
      return {
        id: 'openai',
        label: 'OpenAI',
        buildAdapter: () => () => ({}),
      }
    }
    return null
  }),
}))
vi.mock('@/modules/ai/rag/context', async () => {
  const actual = await vi.importActual<typeof import('@/modules/ai/rag/context')>(
    '@/modules/ai/rag/context',
  )
  return {
    ...actual,
    detectIntent: vi.fn(() => []),
    detectActionIntent: vi.fn(() => null),
    injectDynamicContext: vi.fn().mockResolvedValue(''),
  }
})
vi.mock('@/modules/ai/rag/retrieval', () => ({
  retrieveContext: vi.fn().mockResolvedValue(''),
}))
vi.mock('@/modules/ai/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@tanstack/ai', () => ({
  chat: vi.fn(() => new ReadableStream()),
  toServerSentEventsResponse: vi.fn(() => new Response('ok', { status: 200 })),
}))

describe('AI Chat API - Language Enforcement', () => {
  const handler = (Route.options as any).server?.handlers?.POST

  if (!handler) {
    throw new Error('POST handler not found')
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(getActiveAiConfig).mockResolvedValue({
      provider: 'openai',
      parameters: {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      endpoints: { chat: '', models: '' },
      apiKey: 'test-key',
      baseUrl: 'https://api.openai.com',
      timeout: 1000,
    } as any)
    vi.mocked(validateAiConfig).mockReturnValue({ valid: true } as any)
    vi.mocked(detectBestProvider).mockResolvedValue({ statuses: [], provider: 'openai' })
    vi.mocked(getAllAiConfigs).mockResolvedValue({
      activeProvider: 'openai',
      providers: {
        openai: {
          provider: 'openai',
          baseUrl: 'https://api.openai.com/v1',
          endpoints: { chat: '/chat/completions', models: '/models' },
          parameters: {
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          },
          token: 'test-key',
        },
      },
    } as any)
    vi.mocked(probeProvider).mockResolvedValue({
      id: 'openai',
      label: 'OpenAI',
      available: true,
      status: 'available',
      latencyMs: 10,
    } as any)
    // vi.mocked(getProvider).mockReturnValue(...) // Removed because defined in factory
  })

  it('should inject system prompt with detected locale', async () => {
    const request = new Request('http://localhost/api/ai/chat?locale=es-ES', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hola' }],
      }),
    })

    await handler({ request })

    expect(chat).toHaveBeenCalled()
    const callArgs = vi.mocked(chat).mock.calls[0][0] as any
    const messages = callArgs.messages

    // The route currently injects the locale instruction as a leading system message.
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('Always respond in Spanish')
  })

  it('should default to en-US if locale is missing', async () => {
    const request = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })

    await handler({ request })

    const callArgs = vi.mocked(chat).mock.calls[0][0] as any
    const messages = callArgs.messages

    expect(messages[0].content).toContain('Always respond in English')
  })

  it('should log audit entry', async () => {
    const request = new Request('http://localhost/api/ai/chat?locale=fr-FR', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Bonjour' }],
      }),
    })

    await handler({ request })

    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'fr-FR',
        query: expect.stringContaining('Bonjour'),
        providerId: 'openai',
      }),
    )
  })
})
