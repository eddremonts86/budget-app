import fs from 'node:fs/promises'
import path from 'node:path'

type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue }

type AiProvider = 'openai' | 'anthropic' | 'lm-studio'

type AiConfigFormData = {
  provider: AiProvider
  baseUrl: string
  port: number
  token?: string
  apiKey?: string
  parameters: {
    model: string
    temperature: number
    max_tokens: number
    top_p: number
    frequency_penalty: number
    presence_penalty: number
  }
  endpoints: {
    chat: string
    models: string
    load?: string
    download?: string
    status?: string
  }
  timeout: number
  additionalParams?: string
}

type AiConfigStore = {
  activeProvider: AiProvider
  providers: Record<AiProvider, AiConfigFormData>
}

const workspaceRoot = process.cwd()
const mocksDir = path.join(workspaceRoot, 'mocks')
const dbPath = path.join(mocksDir, 'db.json')
const aiSettingsPath = path.join(mocksDir, 'ai-settings.json')
const appKnowledgePath = path.join(mocksDir, 'app-knowledge.json')
const auditLogsPath = path.join(mocksDir, 'audit-logs.json')
const aiConfigStorePath = path.join(mocksDir, 'ai-config-store.json')

const readJson = async <T>(filePath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const defaultConfig = (provider: AiProvider): AiConfigFormData => {
  if (provider === 'openai') {
    return {
      provider,
      baseUrl: 'https://api.openai.com/v1',
      port: 443,
      token: '',
      apiKey: '',
      parameters: {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      endpoints: {
        chat: '/chat/completions',
        models: '/models',
        load: '',
        download: '',
        status: '',
      },
      timeout: 30000,
      additionalParams: '',
    }
  }

  if (provider === 'anthropic') {
    return {
      provider,
      baseUrl: 'https://api.anthropic.com/v1',
      port: 443,
      token: '',
      apiKey: '',
      parameters: {
        model: 'claude-3-5-sonnet-20240620',
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      endpoints: {
        chat: '/messages',
        models: '/models',
        load: '',
        download: '',
        status: '',
      },
      timeout: 30000,
      additionalParams: '',
    }
  }

  return {
    provider,
    baseUrl: 'http://localhost:1234/v1',
    port: 1234,
    token: '',
    apiKey: '',
    parameters: {
      model: 'local-model',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '/models/load',
      download: '/models/download',
      status: '/models/download/status/:job_id',
    },
    timeout: 30000,
    additionalParams: '',
  }
}

const normalizeConfig = (
  config: Partial<AiConfigFormData> | null | undefined,
  provider: AiProvider,
): AiConfigFormData => {
  const fallback = defaultConfig(provider)
  const mergedParameters = config?.parameters
    ? { ...fallback.parameters, ...config.parameters }
    : fallback.parameters
  const mergedEndpoints = config?.endpoints
    ? { ...fallback.endpoints, ...config.endpoints }
    : fallback.endpoints

  return {
    ...fallback,
    ...config,
    provider,
    token: config?.token ?? config?.apiKey ?? '',
    apiKey: config?.apiKey ?? '',
    parameters: mergedParameters,
    endpoints: mergedEndpoints,
    additionalParams: config?.additionalParams ?? '',
  }
}

const normalizeStore = (store: Partial<AiConfigStore> | null | undefined): AiConfigStore => {
  let activeProvider: AiProvider = 'lm-studio'

  if (
    store?.activeProvider === 'openai' ||
    store?.activeProvider === 'anthropic' ||
    store?.activeProvider === 'lm-studio'
  ) {
    activeProvider = store.activeProvider
  }

  const providers: Record<AiProvider, AiConfigFormData> = {
    openai: normalizeConfig(store?.providers?.openai, 'openai'),
    anthropic: normalizeConfig(store?.providers?.anthropic, 'anthropic'),
    'lm-studio': normalizeConfig(store?.providers?.['lm-studio'], 'lm-studio'),
  }

  return { activeProvider, providers }
}

const main = async () => {
  const db = (await readJson<Record<string, JsonValue>>(dbPath)) ?? {}
  const aiSettings = await readJson<JsonValue>(aiSettingsPath)
  const appKnowledge = await readJson<JsonValue>(appKnowledgePath)
  const auditLogs = await readJson<JsonValue>(auditLogsPath)
  const aiConfigStore = await readJson<AiConfigStore>(aiConfigStorePath)

  const normalizedStore = normalizeStore(aiConfigStore)

  const { ['ai-config']: _legacyAiConfig, ...dbWithoutLegacyConfig } = db

  const nextDb: Record<string, JsonValue> = {
    ...dbWithoutLegacyConfig,
    'ai-config-store': normalizedStore as JsonValue,
  }

  if (aiSettings !== null) {
    nextDb['ai-settings'] = aiSettings
  }

  if (appKnowledge !== null) {
    nextDb['app-knowledge'] = appKnowledge
  }

  if (auditLogs !== null) {
    nextDb['audit-logs'] = auditLogs
  }

  await fs.writeFile(aiConfigStorePath, `${JSON.stringify(normalizedStore, null, 2)}\n`, 'utf-8')
  await fs.writeFile(dbPath, `${JSON.stringify(nextDb, null, 2)}\n`, 'utf-8')

  process.stdout.write('mocks sync complete\n')
}

void main()
