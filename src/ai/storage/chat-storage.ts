/**
 * IndexedDB-based storage for AI chat conversations.
 *
 * Schema:
 *   Database: "ai-chat-db" (version 1)
 *   Object Store: "conversations"
 *     keyPath: "id"
 *     indexes: "userId", "updatedAt"
 *
 * Each conversation stores its full message history and action states,
 * scoped to the authenticated user via `userId`.
 */

// --- Types ---

export interface StoredMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  parts?: Array<{
    type: string
    content?: string
    image?: string
    [key: string]: unknown
  }>
}

export interface PersistedActionState {
  status: 'success' | 'error' | 'denied'
  message: string
}

export interface Conversation {
  id: string
  userId: string
  title: string
  messages: StoredMessage[]
  actionStates: Record<string, PersistedActionState>
  createdAt: number
  updatedAt: number
}

// --- Constants ---

const DB_NAME = 'ai-chat-db'
const DB_VERSION = 1
const STORE_NAME = 'conversations'

// --- IndexedDB Helpers ---

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function txStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  const tx = db.transaction(STORE_NAME, mode)
  return tx.objectStore(STORE_NAME)
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// --- Public API ---

export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Creates a new conversation with reasonable defaults.
 */
export function createConversationObject(userId: string, title?: string): Conversation {
  const now = Date.now()
  return {
    id: generateConversationId(),
    userId,
    title: title ?? '',
    messages: [],
    actionStates: {},
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Generates a title from the first user message in a conversation.
 */
export function generateTitle(messages: StoredMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return ''
  const text = firstUser.content || ''
  // Trim to 60 chars max, cut at word boundary
  if (text.length <= 60) return text
  const trimmed = text.slice(0, 60)
  const lastSpace = trimmed.lastIndexOf(' ')
  return `${lastSpace > 20 ? trimmed.slice(0, lastSpace) : trimmed}…`
}

/**
 * Returns all conversations. If userId is provided, filters by user.
 * Sorted newest first.
 */
export async function getConversations(userId?: string): Promise<Conversation[]> {
  const db = await openDb()
  try {
    const store = txStore(db, 'readonly')
    let all: Conversation[]
    if (userId) {
      const index = store.index('userId')
      all = await reqToPromise(index.getAll(userId))
    } else {
      all = await reqToPromise(store.getAll())
    }
    // Sort by updatedAt descending (newest first)
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
  } finally {
    db.close()
  }
}

/**
 * Returns a single conversation by id.
 */
export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = await openDb()
  try {
    const store = txStore(db, 'readonly')
    const result = await reqToPromise(store.get(id))
    return result ?? undefined
  } finally {
    db.close()
  }
}

/**
 * Saves (creates or updates) a conversation.
 */
export async function saveConversation(conversation: Conversation): Promise<void> {
  const db = await openDb()
  try {
    const store = txStore(db, 'readwrite')
    await reqToPromise(store.put(conversation))
  } finally {
    db.close()
  }
}

/**
 * Deletes a single conversation.
 */
export async function deleteConversation(id: string): Promise<void> {
  const db = await openDb()
  try {
    const store = txStore(db, 'readwrite')
    await reqToPromise(store.delete(id))
  } finally {
    db.close()
  }
}

/**
 * Deletes all conversations for a user.
 */
export async function deleteAllConversations(userId: string): Promise<void> {
  const db = await openDb()
  try {
    const store = txStore(db, 'readwrite')
    const index = store.index('userId')
    const keys = await reqToPromise(index.getAllKeys(userId))
    for (const key of keys) {
      store.delete(key)
    }
    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      store.transaction.oncomplete = () => resolve()
      store.transaction.onerror = () => reject(store.transaction.error)
    })
  } finally {
    db.close()
  }
}

/**
 * Migrates legacy localStorage chat data into IndexedDB.
 * Removes localStorage keys after successful migration.
 */
export async function migrateFromLocalStorage(userId: string): Promise<string | null> {
  if (typeof globalThis.window === 'undefined') return null

  const legacyKey = userId ? `ai:help:messages:${userId}` : 'ai:help:messages'
  const raw = globalThis.window.localStorage.getItem(legacyKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredMessage[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      globalThis.window.localStorage.removeItem(legacyKey)
      return null
    }

    const validMessages = parsed.filter((m) => m?.role)
    if (validMessages.length === 0) {
      globalThis.window.localStorage.removeItem(legacyKey)
      return null
    }

    // Load action states from localStorage
    const actionStatesRaw = globalThis.window.localStorage.getItem('ai:action-states')
    const actionStates: Record<string, PersistedActionState> = actionStatesRaw
      ? (JSON.parse(actionStatesRaw) as Record<string, PersistedActionState>)
      : {}

    const conversation = createConversationObject(userId, generateTitle(validMessages))
    conversation.messages = validMessages
    conversation.actionStates = actionStates

    await saveConversation(conversation)

    // Clean up localStorage
    globalThis.window.localStorage.removeItem(legacyKey)
    globalThis.window.localStorage.removeItem('ai:action-states')

    return conversation.id
  } catch {
    // If migration fails, leave localStorage intact
    return null
  }
}
