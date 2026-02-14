import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectBestProvider, probeProvider } from '@/shared/lib/ai/server/providers'

describe('ai providers', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('marks provider as available when probe returns ok', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }))

    const status = await probeProvider('lmstudio')

    expect(status.available).toBe(true)
    expect(status.status).toBe('available')
  })

  it('marks provider as auth_required on 401', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))

    const status = await probeProvider('openai')

    expect(status.available).toBe(true)
    expect(status.status).toBe('auth_required')
  })

  it('selects first available provider in priority order', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))

    const result = await detectBestProvider()

    expect(result.provider).toBe('openai')
    expect(result.statuses).toHaveLength(3)
  })
})
