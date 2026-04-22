async function loadNodeModules() {
  const fsModule = 'node:fs/promises'
  const [{ default: fs }, { resolveAiDataFilePath }] = await Promise.all([
    import(/* @vite-ignore */ fsModule),
    import('@/modules/ai/server/data-paths'),
  ])

  return { fs, resolveAiDataFilePath }
}

function resolveAuditPaths(
  resolveAiDataFilePath: Awaited<ReturnType<typeof loadNodeModules>>['resolveAiDataFilePath'],
) {
  return {
    logPath: resolveAiDataFilePath('audit-logs.json'),
    settingsPath: resolveAiDataFilePath('ai-settings.json'),
  }
}

export async function readAuditData(): Promise<{
  logs: unknown[]
  settings: Record<string, unknown>
}> {
  const { fs, resolveAiDataFilePath } = await loadNodeModules()
  const { logPath, settingsPath } = resolveAuditPaths(resolveAiDataFilePath)

  try {
    const content = await fs.readFile(logPath, 'utf-8')
    const logs = JSON.parse(content)

    let settings: Record<string, unknown> = {}
    try {
      const settingsContent = await fs.readFile(settingsPath, 'utf-8')
      settings = JSON.parse(settingsContent)
    } catch {
      settings = {}
    }

    return {
      logs: Array.isArray(logs) ? logs : [],
      settings,
    }
  } catch {
    return {
      logs: [],
      settings: {},
    }
  }
}

export async function writeAuditSettings(
  partialSettings: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { fs, resolveAiDataFilePath } = await loadNodeModules()
  const { settingsPath } = resolveAuditPaths(resolveAiDataFilePath)

  let current: Record<string, unknown>
  try {
    const content = await fs.readFile(settingsPath, 'utf-8')
    current = JSON.parse(content)
  } catch {
    current = {}
  }

  const updated = { ...current, ...partialSettings }
  await fs.writeFile(settingsPath, JSON.stringify(updated, null, 2))
  return updated
}
