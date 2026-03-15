async function loadNodeModules() {
  const fsModule = 'node:fs/promises'
  const pathModule = 'node:path'
  const [{ default: fs }, { default: path }] = await Promise.all([
    import(/* @vite-ignore */ fsModule),
    import(/* @vite-ignore */ pathModule),
  ])

  return { fs, path }
}

function resolveAuditPaths(path: Awaited<ReturnType<typeof loadNodeModules>>['path']) {
  return {
    logPath: path.resolve(process.cwd(), 'src/server/data/audit-logs.json'),
    settingsPath: path.resolve(process.cwd(), 'src/server/data/ai-settings.json'),
  }
}

export async function readAuditData(): Promise<{
  logs: unknown[]
  settings: Record<string, unknown>
}> {
  const { fs, path } = await loadNodeModules()
  const { logPath, settingsPath } = resolveAuditPaths(path)

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
  const { fs, path } = await loadNodeModules()
  const { settingsPath } = resolveAuditPaths(path)

  let current: Record<string, unknown> = {}
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
