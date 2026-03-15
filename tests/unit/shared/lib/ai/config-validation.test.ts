import { describe, expect, it } from 'vitest'
import type { AiConfigFormData } from '@/modules/ai/config/schema'
import { validateAiConfig } from '@/modules/ai/config/store'

describe('AI Config Integration', () => {
  const mockLmStudioConfig: AiConfigFormData = {
    provider: 'lm-studio',
    baseUrl: 'http://192.168.1.107:1234/api/v1',
    port: 1234,
    parameters: {
      model: 'local-model',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    endpoints: {
      chat: '/chat',
      models: '/models',
      load: '/models/load',
      download: '/models/download',
      status: '/models/download/status/:job_id',
    },
    timeout: 30000,
  }

  const mockOpenAiConfig: AiConfigFormData = {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    port: 443,
    token: 'sk-123',
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
    },
    parameters: {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    timeout: 30000,
  }

  describe('validateAiConfig', () => {
    it('should validate a correct LM Studio config', () => {
      const result = validateAiConfig(mockLmStudioConfig)
      expect(result.valid).toBe(true)
    })

    it('should validate a correct OpenAI config', () => {
      const result = validateAiConfig(mockOpenAiConfig)
      expect(result.valid).toBe(true)
    })

    it('should fail if OpenAI token is missing', () => {
      const invalidConfig = { ...mockOpenAiConfig, token: '' }
      const result = validateAiConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('MISSING_API_KEY')
    })

    it('should fail if baseUrl is missing', () => {
      const { baseUrl: _, ...configWithoutBaseUrl } = mockLmStudioConfig
      const invalidConfig = configWithoutBaseUrl as Partial<AiConfigFormData>
      const result = validateAiConfig(invalidConfig as AiConfigFormData)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('MISSING_BASE_URL')
    })
  })
})
