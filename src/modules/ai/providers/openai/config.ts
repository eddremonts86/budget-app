import { buildDefaultConfig } from '@/modules/ai/config'
import { OPENAI_PROVIDER_ID } from './types'

export const getOpenAiDefaultConfig = () => buildDefaultConfig(OPENAI_PROVIDER_ID)
