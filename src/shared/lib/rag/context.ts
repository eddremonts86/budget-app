import fs from 'fs/promises'
import path from 'path'

// Simple intent detection
function detectIntent(query: string): string[] {
  const intents = []
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('user') || lowerQuery.includes('usuario')) intents.push('users')
  if (
    lowerQuery.includes('transaction') ||
    lowerQuery.includes('transacción') ||
    lowerQuery.includes('payment')
  )
    intents.push('transactions')
  if (lowerQuery.includes('status') || lowerQuery.includes('estado')) intents.push('status')
  if (lowerQuery.includes('task') || lowerQuery.includes('tarea') || lowerQuery.includes('todo'))
    intents.push('todos')

  return intents
}

export async function injectDynamicContext(query: string): Promise<string> {
  const intents = detectIntent(query)
  if (intents.length === 0) return ''

  let context = ''

  try {
    // In a real app, you would use your DB client here (e.g. Drizzle, Prisma)
    // For this template, we read from mocks/db.json or assume a structure
    // Since this runs on the server, we can read the file

    // Attempt to read mock DB
    const mockDbPath = path.resolve(process.cwd(), 'mocks/db.json')
    const dbContent = await fs.readFile(mockDbPath, 'utf-8').catch(() => null)

    if (dbContent) {
      const db = JSON.parse(dbContent)

      if (intents.includes('users') && db.users) {
        context += `\n[Dynamic Data: Users]\nTotal Users: ${db.users.length}\nRecent Users: ${JSON.stringify(db.users.slice(0, 3))}\n`
      }

      if (intents.includes('transactions') && db.transactions) {
        context += `\n[Dynamic Data: Transactions]\nTotal Transactions: ${db.transactions.length}\nRecent Transactions: ${JSON.stringify(db.transactions.slice(0, 3))}\n`
      }

      if (intents.includes('todos') && db.todos) {
        context += `\n[Dynamic Data: Tasks/Todos]\nTotal Tasks: ${db.todos.length}\nRecent Tasks: ${JSON.stringify(db.todos.slice(0, 3))}\n`
      }
    }

    if (intents.includes('status')) {
      context += `\n[System Status]\nTime: ${new Date().toISOString()}\nEnvironment: ${process.env.NODE_ENV}\n`
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error injecting dynamic context:', error)
  }

  return context
}
