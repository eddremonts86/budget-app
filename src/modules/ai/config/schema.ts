import { z } from 'zod'

export const AI_PROVIDER_IDS = ['llama-cpp', 'ollama', 'lm-studio', 'openai', 'anthropic'] as const

export const aiProviderSchema = z.enum(AI_PROVIDER_IDS)
export type AiProviderId = z.infer<typeof aiProviderSchema>
export type AiProvider = AiProviderId

export const aiParametersSchema = z.object({
  model: z.string().min(1, 'El modelo es obligatorio').default('auto'),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  max_tokens: z.coerce.number().min(1).default(2048),
  top_p: z.coerce.number().min(0).max(1).default(1),
  frequency_penalty: z.coerce.number().min(-2).max(2).default(0),
  presence_penalty: z.coerce.number().min(-2).max(2).default(0),
})

export type AiParameters = z.infer<typeof aiParametersSchema>

export const aiConfigSchema = z.object({
  provider: aiProviderSchema.default('lm-studio'),
  baseUrl: z.string().url('URL base invalida').min(1, 'La URL base es obligatoria'),
  port: z.coerce.number().min(1, 'Puerto invalido').max(65535, 'Puerto invalido'),
  token: z.string().optional(),
  apiKey: z.string().optional(),
  parameters: aiParametersSchema,
  endpoints: z.object({
    chat: z.string().min(1, 'El endpoint de chat es obligatorio'),
    models: z.string().min(1, 'El endpoint de modelos es obligatorio'),
    load: z.string().optional(),
    download: z.string().optional(),
    status: z.string().optional(),
  }),
  timeout: z.coerce
    .number()
    .min(100, 'El timeout debe ser al menos 100ms')
    .max(3600000, 'El timeout maximo es 1 hora (para modelos grandes)'),
  additionalParams: z.string().optional(),
})

export type AiConfigFormData = z.infer<typeof aiConfigSchema>

export interface AiConfigStore {
  activeProvider: AiProvider
  providers: Record<AiProvider, AiConfigFormData>
}

export interface AiConfigAuditLog {
  id: string
  timestamp: string
  action: 'update' | 'reset'
  changes?: Partial<AiConfigFormData>
  userId?: string
}

export type AiGenerationParams = {
  temperature: number
  maxTokens: number
  topP: number
}

export type AiProviderRuntimeConfig = {
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

export type AiRuntimeConfig = {
  baseUrl: string
  providerPriority: AiProviderId[]
  requestTimeoutMs: number
  providers: Record<AiProviderId, AiProviderRuntimeConfig>
}
