import { buildDefaultConfig } from '@/modules/ai/config'
import { OLLAMA_PROVIDER_ID } from './types'

export const getOllamaDefaultConfig = () => buildDefaultConfig(OLLAMA_PROVIDER_ID)
