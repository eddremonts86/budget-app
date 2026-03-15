type EnvRecord = Record<string, string | undefined>

function readClientEnv(): EnvRecord {
  return ((import.meta as ImportMeta & { env?: EnvRecord }).env ?? {}) as EnvRecord
}

function readServerEnv(): EnvRecord {
  return typeof process !== 'undefined' ? (process.env as EnvRecord) : {}
}

function readEnvValue(name: string): string | undefined {
  return readServerEnv()[name] ?? readClientEnv()[name]
}

function parseModuleList(value?: string): string[] {
  if (!value) return []

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getExplicitlyEnabledModuleIds(): string[] {
  return parseModuleList(readEnvValue('VITE_ENABLED_MODULES') ?? readEnvValue('ENABLED_MODULES'))
}

export function getExplicitlyDisabledModuleIds(): string[] {
  return parseModuleList(readEnvValue('VITE_DISABLED_MODULES') ?? readEnvValue('DISABLED_MODULES'))
}
