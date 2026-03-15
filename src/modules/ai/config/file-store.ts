import fs from 'node:fs/promises'
import { resolveAiDataFilePath } from '@/modules/ai/server'
import { resolveAiConfig } from './resolver'
import type { AiConfigStore } from './schema'

const getConfigPath = () => {
  return resolveAiDataFilePath('ai-config-store.json')
}

const getConfigDir = (configPath: string) => {
  const separator = configPath.includes('\\') ? '\\' : '/'
  const idx = configPath.lastIndexOf(separator)
  return idx > 0 ? configPath.slice(0, idx) : process.cwd()
}

export const readAiConfig = async (): Promise<AiConfigStore> => {
  let userConfig: Partial<AiConfigStore> = {}

  try {
    const configPath = getConfigPath()
    await fs.access(configPath)
    const content = await fs.readFile(configPath, 'utf-8')
    const trimmed = content.trim()

    if (!trimmed) {
      userConfig = {}
    } else {
      userConfig = JSON.parse(trimmed)
    }
  } catch {
    userConfig = {}
  }

  return {
    activeProvider: userConfig.activeProvider || 'llama-cpp',
    providers: {
      'llama-cpp': resolveAiConfig('llama-cpp', userConfig.providers?.['llama-cpp']),
      ollama: resolveAiConfig('ollama', userConfig.providers?.ollama),
      'lm-studio': resolveAiConfig('lm-studio', userConfig.providers?.['lm-studio']),
      openai: resolveAiConfig('openai', userConfig.providers?.openai),
      anthropic: resolveAiConfig('anthropic', userConfig.providers?.anthropic),
    },
  }
}

export const writeAiConfig = async (config: AiConfigStore) => {
  const configPath = getConfigPath()
  const configDir = getConfigDir(configPath)
  const uniqueSuffix = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const tempPath = `${configPath}.${uniqueSuffix}.tmp`
  const serializedConfig = JSON.stringify(config, null, 2)

  await fs.mkdir(configDir, { recursive: true })
  await fs.writeFile(tempPath, serializedConfig)
  await fs.rename(tempPath, configPath)

  return config
}
