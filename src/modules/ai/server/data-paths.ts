export type AiDataFileName =
  | 'ai-config-store.json'
  | 'ai-settings.json'
  | 'app-knowledge.json'
  | 'audit-logs.json'

const AI_DATA_DIR_SEGMENTS = ['src', 'modules', 'ai', 'data'] as const

function joinPath(basePath: string, ...segments: readonly string[]): string {
  const separator = basePath.includes('\\') ? '\\' : '/'
  const normalizedBase = basePath.replace(/[\\/]+$/, '')
  const normalizedSegments = segments.map((segment) => segment.replace(/^[\\/]+|[\\/]+$/g, ''))

  return [normalizedBase, ...normalizedSegments].join(separator)
}

export function resolveAiDataDir(): string {
  return joinPath(process.cwd(), ...AI_DATA_DIR_SEGMENTS)
}

export function resolveAiDataFilePath(fileName: AiDataFileName): string {
  return joinPath(resolveAiDataDir(), fileName)
}
