import { describe, it, expect } from 'vitest'
import { resolveAiConfig } from '../../../../src/modules/ai/config/resolver'

describe('ia-config-resolver', () => {
  it('should resolve default configuration for llama-cpp', () => {
    const config = resolveAiConfig('llama-cpp')
    expect(config.provider).toBe('llama-cpp')
    expect(config.parameters.model).toBeDefined()
    expect(config.parameters.temperature).toBe(0.7)
    expect(config.endpoints.chat).toBe('/chat/completions')
  })

  it('should resolve default configuration for ollama', () => {
    const config = resolveAiConfig('ollama')
    expect(config.provider).toBe('ollama')
    expect(config.parameters.model).toBeDefined()
    expect(config.endpoints.models).toBe('/models')
  })

  it('should merge user overrides correctly', () => {
    const userConfig = {
      parameters: {
        temperature: 0.9,
        model: 'custom-model',
      },
      baseUrl: 'http://custom-url:1234',
    }
    const config = resolveAiConfig('ollama', userConfig as any)

    expect(config.provider).toBe('ollama')
    expect(config.parameters.temperature).toBe(0.9)
    expect(config.parameters.model).toBe('custom-model')
    expect(config.baseUrl).toBe('http://custom-url:1234')
    // Defaults should persist if not overridden
    expect(config.parameters.max_tokens).toBe(2048)
  })

  it('should handle unknown provider gracefully', () => {
    const config = resolveAiConfig(
      'unknown-provider' as unknown as Parameters<typeof resolveAiConfig>[0],
    )
    expect(config.provider).toBe('unknown-provider')
    expect(config.endpoints.chat).toBe('/chat/completions')
  })

  it('should correctly extract port from baseUrl', () => {
    const userConfig = {
      baseUrl: 'http://localhost:9999',
    }
    const config = resolveAiConfig('ollama', userConfig as any)
    expect(config.port).toBe(9999)
  })
})
