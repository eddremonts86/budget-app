import type { AiConfigStore } from '@/ai/config'

export async function readPersistedAiConfig() {
  const { readAiConfig } = await import('@/ai/config/file-store')
  return readAiConfig()
}

export async function readPersistedAiConfigOrEmpty() {
  try {
    return await readPersistedAiConfig()
  } catch {
    return createEmptyAiConfigStore()
  }
}

export async function writePersistedAiConfig(config: AiConfigStore) {
  const { writeAiConfig } = await import('@/ai/config/file-store')
  await writeAiConfig(config)
  return config
}

export function createEmptyAiConfigStore() {
  return {
    activeProvider: 'llama-cpp',
    providers: {},
  }
}

export function createAiConfigReadErrorPayload(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : ''

  return {
    activeProvider: 'lm-studio',
    providers: {},
    _debug_error: errorMessage,
    _debug_stack: errorStack,
  }
}
