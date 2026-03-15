export interface AuditEntry {
  timestamp: string
  locale: string
  query: string
  providerId: string
  model: string
  contextLength: number
}

export async function logAudit(entry: AuditEntry) {
  try {
    const fsModule = 'node:fs/promises'
    const pathModule = 'node:path'
    const { default: fs } = await import(/* @vite-ignore */ fsModule)
    const { default: path } = await import(/* @vite-ignore */ pathModule)

    const logPath = path.resolve(process.cwd(), 'src/server/data/audit-logs.json')

    // Ensure directory exists
    await fs.mkdir(path.dirname(logPath), { recursive: true })

    let logs: AuditEntry[] = []
    try {
      const content = await fs.readFile(logPath, 'utf-8')
      logs = JSON.parse(content)
    } catch {
      // File doesn't exist or is invalid, start new
    }

    logs.push(entry)

    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs = logs.slice(-1000)
    }

    await fs.writeFile(logPath, JSON.stringify(logs, null, 2))
  } catch (error) {
     
    console.error('Failed to write audit log:', error)
  }
}
