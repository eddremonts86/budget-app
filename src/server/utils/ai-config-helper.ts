
import fs from 'node:fs/promises'
import { resolveAiConfig } from './ia-config-resolver'

// Helper to get config path safely
const getConfigPath = () => {
  // Manual path resolution to avoid importing 'path' which triggers browserify shim
  const cwd = process.cwd()
  const separator = cwd.includes('\\') ? '\\' : '/'
  return `${cwd}${separator}src${separator}server${separator}data${separator}ai-config-store.json`
}

export const readAiConfig = async () => {
  let userConfig: any = {}

  try {
    const configPath = getConfigPath()
    // Check if file exists
    await fs.access(configPath)
    const content = await fs.readFile(configPath, 'utf-8')
    userConfig = JSON.parse(content)
  } catch (err) {
    console.warn('[AiConfigHelper] Config file not found or access error, using defaults:', err)
  }

  // Resolve config using ia-config + user overrides
  return {
    activeProvider: userConfig.activeProvider || 'llama-cpp',
    providers: {
      'llama-cpp': resolveAiConfig('llama-cpp', userConfig.providers?.['llama-cpp']),
      'ollama': resolveAiConfig('ollama', userConfig.providers?.['ollama']),
      'lm-studio': resolveAiConfig('lm-studio', userConfig.providers?.['lm-studio']),
      'openai': resolveAiConfig('openai', userConfig.providers?.['openai']),
      'anthropic': resolveAiConfig('anthropic', userConfig.providers?.['anthropic']),
    }
  }
}

export const writeAiConfig = async (config: any) => {
  try {
    const configPath = getConfigPath()

    // fs from node:fs/promises should have writeFile
    if (!fs.writeFile) {
       // Check if it's nested in default (fallback for some environments)
       const fsAny = fs as any
       if (fsAny.default && fsAny.default.writeFile) {
           await fsAny.default.writeFile(configPath, JSON.stringify(config, null, 2))
           return config
       }

       const keys = Object.keys(fs || {})
       throw new Error(`fs.writeFile is not available on node:fs/promises import. Keys: ${keys.join(', ')}`)
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
    return config
  } catch (error) {
    console.error('[AiConfigHelper] Error writing config:', error)
    throw error
  }
}
