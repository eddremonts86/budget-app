export type AuthMode = 'local' | 'clerk' | 'hybrid'

const DEFAULT_AUTH_MODE: AuthMode = 'hybrid'
const DEFAULT_BETTER_AUTH_URL = 'http://localhost:3000'
const DEFAULT_DEV_BETTER_AUTH_SECRET = 'dev-only-better-auth-secret-change-me-1234567890'

type EnvRecord = Record<string, string | undefined>

function readClientEnv(): EnvRecord {
  return ((import.meta as ImportMeta & { env?: EnvRecord }).env ?? {}) as EnvRecord
}

function readServerEnv(): EnvRecord {
  return typeof process !== 'undefined' ? (process.env as EnvRecord) : {}
}

function readEnvValue(name: string): string | undefined {
  const serverValue = readServerEnv()[name]
  if (serverValue) return serverValue

  const clientValue = readClientEnv()[name]
  if (clientValue) return clientValue

  return undefined
}

function normalizeAuthMode(value?: string): AuthMode {
  if (value === 'local' || value === 'clerk' || value === 'hybrid') {
    return value
  }

  return DEFAULT_AUTH_MODE
}

export function getAuthMode(): AuthMode {
  return normalizeAuthMode(readEnvValue('AUTH_MODE') ?? readEnvValue('VITE_AUTH_MODE'))
}

export function isBetterAuthEnabled() {
  const mode = getAuthMode()
  return mode === 'local' || mode === 'hybrid'
}

export function isClerkEnabled() {
  const mode = getAuthMode()
  return mode === 'clerk' || mode === 'hybrid'
}

export function getBetterAuthUrl() {
  return (
    readEnvValue('BETTER_AUTH_URL') ??
    readEnvValue('VITE_BETTER_AUTH_URL') ??
    DEFAULT_BETTER_AUTH_URL
  )
}

export function getBetterAuthSecret() {
  return readEnvValue('BETTER_AUTH_SECRET') ?? DEFAULT_DEV_BETTER_AUTH_SECRET
}

export function getClerkPublishableKey() {
  return readEnvValue('VITE_CLERK_PUBLISHABLE_KEY')
}

export function getClerkSecretKey() {
  return readServerEnv().CLERK_SECRET_KEY
}

export function isClerkServerEnabled() {
  return isClerkEnabled() && !!getClerkSecretKey()
}
