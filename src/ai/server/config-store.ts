import type { AiConfigStore } from '@/ai/config'

async function loadFileStoreModule() {
  const modulePath = '@/ai/config/file-store'
  return await import(/* @vite-ignore */ modulePath)
}

export async function readPersistedAiConfig() {
  const { readAiConfig } = await loadFileStoreModule()
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
  const { writeAiConfig } = await loadFileStoreModule()
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
