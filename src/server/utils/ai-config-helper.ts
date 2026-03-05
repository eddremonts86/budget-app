import fs from 'node:fs/promises'
import { resolveAiConfig } from './ia-config-resolver'

// Helper to get config path safely
const getConfigPath = () => {
  // Manual path resolution to avoid importing 'path' which triggers browserify shim
  const cwd = process.cwd()
  const separator = cwd.includes('\\') ? '\\' : '/'
  return `${cwd}${separator}src${separator}server${separator}data${separator}ai-config-store.json`
}

const getConfigDir = (configPath: string) => {
  const separator = configPath.includes('\\') ? '\\' : '/'
  const idx = configPath.lastIndexOf(separator)
  return idx > 0 ? configPath.slice(0, idx) : process.cwd()
}

export const readAiConfig = async () => {
  let userConfig: any = {}

  try {
    const configPath = getConfigPath()
    // Check if file exists
    await fs.access(configPath)
    const content = await fs.readFile(configPath, 'utf-8')
    const trimmed = content.trim()

    if (!trimmed) {
      userConfig = {}
    } else {
      try {
        userConfig = JSON.parse(trimmed)
      } catch (parseError) {
        console.warn('[AiConfigHelper] Invalid JSON in config file, using defaults:', parseError)
        userConfig = {}
      }
    }
  } catch (err) {
    console.warn('[AiConfigHelper] Config file not found or access error, using defaults:', err)
  }

  // Resolve config using ia-config + user overrides
  return {
    activeProvider: userConfig.activeProvider || 'llama-cpp',
    providers: {
      'llama-cpp': resolveAiConfig('llama-cpp', userConfig.providers?.['llama-cpp']),
      ollama: resolveAiConfig('ollama', userConfig.providers?.['ollama']),
      'lm-studio': resolveAiConfig('lm-studio', userConfig.providers?.['lm-studio']),
      openai: resolveAiConfig('openai', userConfig.providers?.['openai']),
      anthropic: resolveAiConfig('anthropic', userConfig.providers?.['anthropic']),
    },
  }
}

export const writeAiConfig = async (config: any) => {
  try {
    const configPath = getConfigPath()
    const configDir = getConfigDir(configPath)
    const uniqueSuffix = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const tempPath = `${configPath}.${uniqueSuffix}.tmp`
    const serializedConfig = JSON.stringify(config, null, 2)

    await fs.mkdir(configDir, { recursive: true })

    // fs from node:fs/promises should have writeFile
    if (!fs.writeFile) {
      // Check if it's nested in default (fallback for some environments)
      const fsAny = fs as any
      if (fsAny.default && fsAny.default.writeFile) {
        await fsAny.default.mkdir(configDir, { recursive: true })
        await fsAny.default.writeFile(tempPath, serializedConfig)
        await fsAny.default.rename(tempPath, configPath)
        return config
      }

      const keys = Object.keys(fs || {})
      throw new Error(
        `fs.writeFile is not available on node:fs/promises import. Keys: ${keys.join(', ')}`,
      )
    }

    await fs.writeFile(tempPath, serializedConfig)
    await fs.rename(tempPath, configPath)
    return config
  } catch (error) {
    console.error('[AiConfigHelper] Error writing config:', error)
    throw error
  }
}
