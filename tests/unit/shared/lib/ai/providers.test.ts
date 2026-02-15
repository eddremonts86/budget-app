import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getActiveAiConfig } from '@/shared/lib/ai/server/config-store'
import { detectBestProvider, probeProvider } from '@/shared/lib/ai/server/providers'

vi.mock('@/shared/lib/ai/server/config-store', () => ({
  getActiveAiConfig: vi.fn(),
}))

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
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = await probeProvider({ ...mockConfig, provider: 'lm-studio' } as any)

    expect(status.available).toBe(true)
    expect(status.status).toBe('available')
  })

  it('marks provider as auth_required on 401', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = await probeProvider({ ...mockConfig, provider: 'openai' } as any)

    expect(status.available).toBe(true)
    expect(status.status).toBe('auth_required')
  })

  it('detects best provider using active config', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getActiveAiConfig).mockResolvedValue({ ...mockConfig, provider: 'openai' } as any)

    const result = await detectBestProvider()

    expect(result.provider).toBe('openai')
    expect(result.statuses).toHaveLength(1)
    expect(result.statuses[0].status).toBe('available')
  })
})
