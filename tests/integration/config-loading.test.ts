// @vitest-environment node
import fs from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readAiConfig } from '../../src/modules/ai/config/file-store'

// Mock dependencies before import
vi.mock('node:fs/promises')
vi.mock('node:child_process', () => ({
  exec: (_cmd: unknown, cb: (error: Error | null, result: { stdout: string }) => void) =>
    cb(null, { stdout: '' }),
}))

describe('Configuration Loading System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load default configuration when config file is missing', async () => {
    // Simulate file not found error
    vi.mocked(fs.access).mockRejectedValue(new Error('File not found'))

    const config = await readAiConfig()

    expect(config.activeProvider).toBe('llama-cpp')
    expect(config.providers['ollama'].parameters.model).toBeDefined()
    expect(config.providers['ollama'].baseUrl).toBe('http://localhost:11434/v1')
  })

  it('should load and merge user configuration correctly', async () => {
    // Simulate existing config file
    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        activeProvider: 'ollama',
        providers: {
          ollama: {
            parameters: {
              temperature: 0.9,
              model: 'custom-model',
            },
          },
        },
      }),
    )

    const config = await readAiConfig()

    expect(config.activeProvider).toBe('ollama')
    expect(config.providers['ollama'].parameters.temperature).toBe(0.9)
    expect(config.providers['ollama'].parameters.model).toBe('custom-model')
    // Should still have default values for other fields
    expect(config.providers['ollama'].parameters.max_tokens).toBe(2048)
  })

  it('should handle malformed configuration file gracefully', async () => {
    // Simulate existing but malformed config file
    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.readFile).mockResolvedValue('{ invalid json')

    const config = await readAiConfig()

    // Should fall back to defaults
    expect(config.activeProvider).toBe('llama-cpp')
    expect(config.providers['ollama'].parameters.model).toBeDefined()
  })
})
