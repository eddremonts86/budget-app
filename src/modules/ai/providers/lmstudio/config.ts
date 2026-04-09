import { buildDefaultConfig } from '@/modules/ai/config'
import { LMSTUDIO_PROVIDER_ID } from './types'

export const getLmStudioDefaultConfig = () => buildDefaultConfig(LMSTUDIO_PROVIDER_ID)
