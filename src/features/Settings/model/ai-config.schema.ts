import { z } from 'zod'

export const aiProviderSchema = z.enum([
  'llama-cpp',
  'ollama',
  'lm-studio',
  'openai',
  'anthropic',
])
export type AiProvider = z.infer<typeof aiProviderSchema>

export const aiParametersSchema = z.object({
  model: z.string().min(1, 'El modelo es obligatorio'),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  max_tokens: z.coerce.number().min(1).default(2048),
  top_p: z.coerce.number().min(0).max(1).default(1),
  frequency_penalty: z.coerce.number().min(-2).max(2).default(0),
  presence_penalty: z.coerce.number().min(-2).max(2).default(0),
})

export type AiParameters = z.infer<typeof aiParametersSchema>

export const aiConfigSchema = z.object({
  provider: aiProviderSchema.default('lm-studio'),
  baseUrl: z.string().url('URL base inválida').min(1, 'La URL base es obligatoria'),
  port: z.coerce.number().min(1, 'Puerto inválido').max(65535, 'Puerto inválido'),
  token: z.string().optional(),
  apiKey: z.string().optional(), // Alias para token si se prefiere
  parameters: aiParametersSchema,
  endpoints: z.object({
    chat: z.string().min(1, 'El endpoint de chat es obligatorio'),
    models: z.string().min(1, 'El endpoint de modelos es obligatorio'),
    load: z.string().optional(), // LM Studio
    download: z.string().optional(), // LM Studio
    status: z.string().optional(), // LM Studio
  }),
  timeout: z.coerce
    .number()
    .min(100, 'El timeout debe ser al menos 100ms')
    .max(3600000, 'El timeout máximo es 1 hora (para modelos grandes)'),
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
