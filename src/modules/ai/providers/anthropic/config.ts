import { buildDefaultConfig } from '@/modules/ai/config'
import { ANTHROPIC_PROVIDER_ID } from './types'

export const getAnthropicDefaultConfig = () => buildDefaultConfig(ANTHROPIC_PROVIDER_ID)
