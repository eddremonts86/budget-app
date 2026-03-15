import path from 'node:path'

export type AiDataFileName =
  | 'ai-config-store.json'
  | 'ai-settings.json'
  | 'app-knowledge.json'
  | 'audit-logs.json'

const AI_DATA_DIR_SEGMENTS = ['src', 'modules', 'ai', 'data'] as const

export function resolveAiDataDir(): string {
  return path.resolve(process.cwd(), ...AI_DATA_DIR_SEGMENTS)
}

export function resolveAiDataFilePath(fileName: AiDataFileName): string {
  return path.resolve(resolveAiDataDir(), fileName)
}
