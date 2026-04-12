import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllAiConfigs } from '@/modules/ai/config/store'
import { detectBestProvider, probeProvider } from '@/modules/ai/providers'

vi.mock('@/modules/ai/config/store', async () => {
  const actual = await vi.importActual<typeof import('@/modules/ai/config/store')>(
    '@/modules/ai/config/store',
  )
  return {
    ...actual,
    getAllAiConfigs: vi.fn(),
  }
})

describe('ai providers', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    vi.clearAllMocks()
  })

  const mockConfig = {
    provider: 'lm-studio',
    baseUrl: 'http://localhost:1234',
    endpoints: { models: '/v1/models' },
    parameters: {},
  }

  it('marks provider as available when probe returns ok', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ id: 'model-1' }] }), { status: 200 }),
    )

    const status = await probeProvider({ ...mockConfig, provider: 'lm-studio' } as any)

    expect(status.available).toBe(true)
    expect(status.status).toBe('available')
  })

  it('marks provider as auth_required on 401', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))

    const status = await probeProvider({ ...mockConfig, provider: 'openai' } as any)

    expect(status.available).toBe(false)
    expect(status.status).toBe('auth_required')
  })

  it('detects best provider using active config', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ id: 'model-1' }] }), { status: 200 }),
    )

    vi.mocked(getAllAiConfigs).mockResolvedValue({
      activeProvider: 'openai',
      providers: {
        openai: {
          ...mockConfig,
          provider: 'openai',
          endpoints: { models: '/v1/models', chat: '/chat/completions' },
        },
      },
    } as any)

    const result = await detectBestProvider()

    expect(result.provider).toBe('openai')
    expect(result.statuses).toHaveLength(1)
    expect(result.statuses[0].status).toBe('available')
  })

  it('falls back to localhost when llama-cpp hostname is unreachable', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 'llama-1' }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 'llama-1' }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 'llama-1' }] }), { status: 200 }),
      )

    const status = await probeProvider({
      ...mockConfig,
      provider: 'llama-cpp',
      baseUrl: 'http://llama-cpp:8080/v1',
      endpoints: { models: '/models', chat: '/chat/completions' },
    } as any)

    expect(status.available).toBe(true)
    expect(status.status).toBe('available')
    expect(fetchMock).toHaveBeenCalled()
    expect(fetchMock.mock.calls[1]?.[0]).toContain('http://localhost:8080/v1/models')
  })
})
