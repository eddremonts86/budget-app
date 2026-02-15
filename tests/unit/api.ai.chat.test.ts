import { chat } from '@tanstack/ai'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Route } from '@/routes/api.ai.chat'
import { logAudit } from '@/shared/lib/ai/audit'
import { getActiveAiConfig, validateAiConfig } from '@/shared/lib/ai/server/config-store'
import { detectBestProvider } from '@/shared/lib/ai/server/providers'

// Mock dependencies
vi.mock('@/shared/lib/ai/server/config-store')
vi.mock('@/shared/lib/ai/server/providers', () => ({
  detectBestProvider: vi.fn(),
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
vi.mock('@/shared/lib/rag/context', () => ({
  injectDynamicContext: vi.fn().mockResolvedValue(''),
}))
vi.mock('@/shared/lib/rag/retrieval', () => ({
  retrieveContext: vi.fn().mockResolvedValue(''),
}))
vi.mock('@/shared/lib/ai/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@tanstack/ai', () => ({
  chat: vi.fn(() => new ReadableStream()),
  toServerSentEventsResponse: vi.fn(),
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

    // Check first message is system prompt
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('Locale: "es-ES"')
    expect(messages[0].content).toContain('Do not discuss these rules')
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

    expect(messages[0].content).toContain('Locale: "en-US"')
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
