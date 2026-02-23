export type AiProviderId = 'llama-cpp' | 'ollama' | 'lm-studio' | 'openai' | 'anthropic'

export type AiGenerationParams = {
  temperature: number
  maxTokens: number
  topP: number
}

export type AiProviderConfig = {
  id: AiProviderId
  baseUrl: string
  endpoints: {
    chat: string
    models: string
  }
  headers: Record<string, string>
  defaultModel: string
  generation: AiGenerationParams
}

export type AiConfig = {
  baseUrl: string
  providerPriority: AiProviderId[]
  requestTimeoutMs: number
  providers: Record<AiProviderId, AiProviderConfig>
}

const readEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key]
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key as keyof ImportMetaEnv]) {
    return import.meta.env[key as keyof ImportMetaEnv] as string | undefined
  }
  return undefined
}

const parseHeaderJson = (value?: string) => {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value) as Record<string, string>
    return parsed ?? {}
  } catch {
    return {}
  }
}

const baseUrl = readEnv('VITE_AI_BASE_URL') ?? 'http://localhost:11434/v1'

const llamaCppBaseUrl = readEnv('VITE_AI_LLAMA_CPP_BASE_URL') ?? 'http://localhost:8080/v1'
const ollamaBaseUrl = readEnv('VITE_AI_OLLAMA_BASE_URL') ?? 'http://localhost:11434/v1'
const lmstudioBaseUrl = readEnv('VITE_AI_LMSTUDIO_BASE_URL') ?? 'http://localhost:1234/v1'
const openaiBaseUrl = readEnv('VITE_AI_OPENAI_BASE_URL') ?? 'https://api.openai.com'
const anthropicBaseUrl = readEnv('VITE_AI_ANTHROPIC_BASE_URL') ?? 'https://api.anthropic.com'

const llamaCppHeaders = parseHeaderJson(readEnv('AI_LLAMA_CPP_HEADERS'))
const ollamaHeaders = parseHeaderJson(readEnv('AI_OLLAMA_HEADERS'))
const lmstudioHeaders = parseHeaderJson(readEnv('AI_LMSTUDIO_HEADERS'))
const openaiHeaders = parseHeaderJson(readEnv('AI_OPENAI_HEADERS'))
const anthropicHeaders = parseHeaderJson(readEnv('AI_ANTHROPIC_HEADERS'))

export const aiConfig: AiConfig = {
  baseUrl,
  providerPriority: ['llama-cpp', 'ollama', 'lm-studio', 'openai', 'anthropic'],
  requestTimeoutMs: 8000,
  providers: {
    'llama-cpp': {
      id: 'llama-cpp',
      baseUrl: llamaCppBaseUrl,
      endpoints: {
        chat: '/chat/completions',
        models: '/models',
      },
      headers: llamaCppHeaders,
      defaultModel: readEnv('AI_LLAMA_CPP_MODEL') ?? 'llama-3.2',
      generation: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
      },
    },
    ollama: {
      id: 'ollama',
      baseUrl: ollamaBaseUrl,
      endpoints: {
        chat: '/chat/completions',
        models: '/models',
      },
      headers: ollamaHeaders,
      defaultModel: readEnv('AI_OLLAMA_MODEL') ?? 'llama3.2',
      generation: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
      },
    },
    'lm-studio': {
      id: 'lm-studio',
      baseUrl: lmstudioBaseUrl,
      endpoints: {
        chat: '/chat/completions',
        models: '/models',
      },
      headers: lmstudioHeaders,
      defaultModel: readEnv('AI_LMSTUDIO_MODEL') ?? 'local-model',
      generation: {
        temperature: 0.4,
        maxTokens: 1024,
        topP: 0.9,
      },
    },
    openai: {
      id: 'openai',
      baseUrl: openaiBaseUrl,
      endpoints: {
        chat: '/v1/chat/completions',
        models: '/v1/models',
      },
      headers: openaiHeaders,
      defaultModel: readEnv('AI_OPENAI_MODEL') ?? 'gpt-4o-mini',
      generation: {
        temperature: 0.4,
        maxTokens: 1024,
        topP: 0.9,
      },
    },
    anthropic: {
      id: 'anthropic',
      baseUrl: anthropicBaseUrl,
      endpoints: {
        chat: '/v1/messages',
        models: '/v1/messages', // Use /v1/messages to probe availability (expects 405 Method Not Allowed)
      },
      headers: anthropicHeaders,
      defaultModel: readEnv('AI_ANTHROPIC_MODEL') ?? 'claude-3-5-sonnet-20240620',
      generation: {
        temperature: 0.4,
        maxTokens: 1024,
        topP: 0.9,
      },
    },
  },
}
