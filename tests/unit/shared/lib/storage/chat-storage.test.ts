import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createConversationObject,
  deleteAllConversations,
  deleteConversation,
  generateConversationId,
  generateTitle,
  getConversation,
  getConversations,
  migrateFromLocalStorage,
  saveConversation,
  type StoredMessage,
} from '@/modules/ai/storage/chat-storage'

// Clean up IndexedDB between tests
function clearIndexedDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('ai-chat-db')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// In-memory localStorage polyfill for test environments where jsdom
// doesn't provide a fully functional Storage implementation.
function ensureLocalStorage() {
  const store = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
  Object.defineProperty(globalThis.window, 'localStorage', {
    value: storage,
    writable: true,
    configurable: true,
  })
  return storage
}

describe('chat-storage', () => {
  let storage: Storage

  beforeEach(async () => {
    await clearIndexedDB()
    storage = ensureLocalStorage()
    storage.clear()
  })

  afterEach(async () => {
    await clearIndexedDB()
    storage.clear()
  })

  // -----------------------------------------------
  // generateConversationId
  // -----------------------------------------------
  describe('generateConversationId', () => {
    it('should return a string starting with "conv_"', () => {
      const id = generateConversationId()
      expect(id).toMatch(/^conv_\d+_[a-z0-9]+$/)
    })

    it('should generate unique ids', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateConversationId()))
      expect(ids.size).toBe(100)
    })
  })

  // -----------------------------------------------
  // createConversationObject
  // -----------------------------------------------
  describe('createConversationObject', () => {
    it('should create a conversation with defaults', () => {
      const conv = createConversationObject('user_1')
      expect(conv.id).toMatch(/^conv_/)
      expect(conv.userId).toBe('user_1')
      expect(conv.title).toBe('')
      expect(conv.messages).toEqual([])
      expect(conv.actionStates).toEqual({})
      expect(conv.createdAt).toBeGreaterThan(0)
      expect(conv.updatedAt).toBe(conv.createdAt)
    })

    it('should accept a custom title', () => {
      const conv = createConversationObject('user_1', 'My Chat')
      expect(conv.title).toBe('My Chat')
    })
  })

  // -----------------------------------------------
  // generateTitle
  // -----------------------------------------------
  describe('generateTitle', () => {
    it('should return empty string if no user messages', () => {
      const messages: StoredMessage[] = [{ role: 'assistant', content: 'Hello!' }]
      expect(generateTitle(messages)).toBe('')
    })

    it('should return empty string for empty array', () => {
      expect(generateTitle([])).toBe('')
    })

    it('should use the first user message as title', () => {
      const messages: StoredMessage[] = [
        { role: 'user', content: 'What is TypeScript?' },
        { role: 'assistant', content: 'TypeScript is a typed superset of JavaScript.' },
      ]
      expect(generateTitle(messages)).toBe('What is TypeScript?')
    })

    it('should truncate long messages at word boundary', () => {
      const longText =
        'This is a very long message that exceeds sixty characters and should be truncated at a word boundary'
      const messages: StoredMessage[] = [{ role: 'user', content: longText }]
      const title = generateTitle(messages)
      expect(title.length).toBeLessThanOrEqual(65) // 60 + ellipsis + word boundary
      expect(title).toContain('…')
    })

    it('should not truncate messages <= 60 chars', () => {
      const text = 'Short message under limit'
      const messages: StoredMessage[] = [{ role: 'user', content: text }]
      expect(generateTitle(messages)).toBe(text)
    })
  })

  // -----------------------------------------------
  // CRUD operations
  // -----------------------------------------------
  describe('CRUD operations', () => {
    const userId = 'user_test'

    it('should save and retrieve a conversation', async () => {
      const conv = createConversationObject(userId, 'Test Chat')
      conv.messages = [{ role: 'user', content: 'Hello' }]

      await saveConversation(conv)

      const retrieved = await getConversation(conv.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(conv.id)
      expect(retrieved!.title).toBe('Test Chat')
      expect(retrieved!.messages).toHaveLength(1)
      expect(retrieved!.messages[0].content).toBe('Hello')
    })

    it('should return undefined for non-existent conversation', async () => {
      const result = await getConversation('non_existent_id')
      expect(result).toBeUndefined()
    })

    it('should list conversations sorted by updatedAt descending', async () => {
      const conv1 = createConversationObject(userId, 'First')
      conv1.updatedAt = 1000

      const conv2 = createConversationObject(userId, 'Second')
      conv2.updatedAt = 3000

      const conv3 = createConversationObject(userId, 'Third')
      conv3.updatedAt = 2000

      await saveConversation(conv1)
      await saveConversation(conv2)
      await saveConversation(conv3)

      const conversations = await getConversations(userId)
      expect(conversations).toHaveLength(3)
      expect(conversations[0].title).toBe('Second')
      expect(conversations[1].title).toBe('Third')
      expect(conversations[2].title).toBe('First')
    })

    it('should only return conversations for the specified user', async () => {
      const conv1 = createConversationObject('user_a', 'User A Chat')
      const conv2 = createConversationObject('user_b', 'User B Chat')

      await saveConversation(conv1)
      await saveConversation(conv2)

      const userAConvs = await getConversations('user_a')
      expect(userAConvs).toHaveLength(1)
      expect(userAConvs[0].title).toBe('User A Chat')

      const userBConvs = await getConversations('user_b')
      expect(userBConvs).toHaveLength(1)
      expect(userBConvs[0].title).toBe('User B Chat')
    })

    it('should return empty array for user with no conversations', async () => {
      const conversations = await getConversations('no_such_user')
      expect(conversations).toEqual([])
    })

    it('should update an existing conversation (put)', async () => {
      const conv = createConversationObject(userId, 'Original')
      await saveConversation(conv)

      conv.title = 'Updated'
      conv.messages = [{ role: 'user', content: 'Updated message' }]
      conv.updatedAt = Date.now()
      await saveConversation(conv)

      const retrieved = await getConversation(conv.id)
      expect(retrieved!.title).toBe('Updated')
      expect(retrieved!.messages).toHaveLength(1)
      expect(retrieved!.messages[0].content).toBe('Updated message')
    })

    it('should delete a single conversation', async () => {
      const conv1 = createConversationObject(userId, 'Keep')
      const conv2 = createConversationObject(userId, 'Delete')

      await saveConversation(conv1)
      await saveConversation(conv2)

      await deleteConversation(conv2.id)

      const conversations = await getConversations(userId)
      expect(conversations).toHaveLength(1)
      expect(conversations[0].title).toBe('Keep')

      const deleted = await getConversation(conv2.id)
      expect(deleted).toBeUndefined()
    })

    it('should not throw when deleting non-existent conversation', async () => {
      await expect(deleteConversation('non_existent')).resolves.not.toThrow()
    })

    it('should delete all conversations for a user', async () => {
      const conv1 = createConversationObject(userId, 'Chat 1')
      const conv2 = createConversationObject(userId, 'Chat 2')
      const otherConv = createConversationObject('other_user', 'Other Chat')

      await saveConversation(conv1)
      await saveConversation(conv2)
      await saveConversation(otherConv)

      await deleteAllConversations(userId)

      const userConvs = await getConversations(userId)
      expect(userConvs).toEqual([])

      // Other user's conversations should remain
      const otherConvs = await getConversations('other_user')
      expect(otherConvs).toHaveLength(1)
    })

    it('should not throw when deleting all for user with no conversations', async () => {
      await expect(deleteAllConversations('no_such_user')).resolves.not.toThrow()
    })
  })

  // -----------------------------------------------
  // Action states persistence
  // -----------------------------------------------
  describe('action states', () => {
    it('should persist action states with conversation', async () => {
      const conv = createConversationObject('user_1')
      conv.actionStates = {
        action_hash_1: { status: 'success', message: 'Task created' },
        action_hash_2: { status: 'error', message: 'Failed' },
      }
      await saveConversation(conv)

      const retrieved = await getConversation(conv.id)
      expect(retrieved!.actionStates).toEqual({
        action_hash_1: { status: 'success', message: 'Task created' },
        action_hash_2: { status: 'error', message: 'Failed' },
      })
    })
  })

  // -----------------------------------------------
  // Message parts persistence
  // -----------------------------------------------
  describe('message parts', () => {
    it('should persist complex message parts', async () => {
      const conv = createConversationObject('user_1')
      conv.messages = [
        {
          role: 'user',
          content: 'Hello',
          parts: [{ type: 'text', content: 'Hello' }],
        },
        {
          role: 'assistant',
          content: 'Response with thinking',
          parts: [
            { type: 'thinking', content: 'Analyzing...' },
            { type: 'text', content: 'Here is my response' },
          ],
        },
        {
          role: 'user',
          content: 'Image',
          parts: [{ type: 'image', image: 'data:image/png;base64,...' }],
        },
      ]
      await saveConversation(conv)

      const retrieved = await getConversation(conv.id)
      expect(retrieved!.messages).toHaveLength(3)
      expect(retrieved!.messages[1].parts).toHaveLength(2)
      expect(retrieved!.messages[1].parts![0].type).toBe('thinking')
      expect(retrieved!.messages[2].parts![0].image).toBe('data:image/png;base64,...')
    })
  })

  // -----------------------------------------------
  // migrateFromLocalStorage
  // -----------------------------------------------
  describe('migrateFromLocalStorage', () => {
    it('should migrate messages from localStorage to IndexedDB', async () => {
      const messages: StoredMessage[] = [
        { role: 'user', content: 'Hello from localStorage' },
        { role: 'assistant', content: 'Hi there!' },
      ]
      storage.setItem('ai:help:messages:user_1', JSON.stringify(messages))

      const migratedId = await migrateFromLocalStorage('user_1')
      expect(migratedId).not.toBeNull()
      expect(migratedId).toMatch(/^conv_/)

      // Verify conversation was created in IndexedDB
      const conv = await getConversation(migratedId!)
      expect(conv).toBeDefined()
      expect(conv!.userId).toBe('user_1')
      expect(conv!.messages).toHaveLength(2)
      expect(conv!.messages[0].content).toBe('Hello from localStorage')
      expect(conv!.title).toBe('Hello from localStorage')

      // Verify localStorage was cleaned up
      expect(storage.getItem('ai:help:messages:user_1')).toBeNull()
    })

    it('should migrate action states from localStorage', async () => {
      const messages: StoredMessage[] = [{ role: 'user', content: 'Create a task' }]
      const actionStates = {
        hash_1: { status: 'success', message: 'Done' },
      }
      storage.setItem('ai:help:messages:user_2', JSON.stringify(messages))
      storage.setItem('ai:action-states', JSON.stringify(actionStates))

      const migratedId = await migrateFromLocalStorage('user_2')
      const conv = await getConversation(migratedId!)
      expect(conv!.actionStates).toEqual(actionStates)

      // Verify action states localStorage was cleaned up
      expect(storage.getItem('ai:action-states')).toBeNull()
    })

    it('should return null if no localStorage data exists', async () => {
      const result = await migrateFromLocalStorage('user_1')
      expect(result).toBeNull()
    })

    it('should return null and clean up for empty array', async () => {
      storage.setItem('ai:help:messages:user_1', JSON.stringify([]))
      const result = await migrateFromLocalStorage('user_1')
      expect(result).toBeNull()
      expect(storage.getItem('ai:help:messages:user_1')).toBeNull()
    })

    it('should return null for invalid JSON', async () => {
      storage.setItem('ai:help:messages:user_1', 'not-json')
      const result = await migrateFromLocalStorage('user_1')
      expect(result).toBeNull()
    })

    it('should filter messages without role', async () => {
      const messages = [
        { role: 'user', content: 'Valid' },
        { content: 'No role' },
        null,
        { role: 'assistant', content: 'Also valid' },
      ]
      storage.setItem('ai:help:messages:user_1', JSON.stringify(messages))

      const migratedId = await migrateFromLocalStorage('user_1')
      const conv = await getConversation(migratedId!)
      expect(conv!.messages).toHaveLength(2)
      expect(conv!.messages[0].content).toBe('Valid')
      expect(conv!.messages[1].content).toBe('Also valid')
    })

    it('should return null if all messages are invalid', async () => {
      const messages = [{ content: 'No role' }, null]
      storage.setItem('ai:help:messages:user_1', JSON.stringify(messages))

      const result = await migrateFromLocalStorage('user_1')
      expect(result).toBeNull()
      expect(storage.getItem('ai:help:messages:user_1')).toBeNull()
    })
  })

  // -----------------------------------------------
  // Concurrent operations
  // -----------------------------------------------
  describe('concurrent operations', () => {
    it('should handle multiple simultaneous saves', async () => {
      const userId = 'user_concurrent'
      const convs = Array.from({ length: 5 }, (_, i) =>
        createConversationObject(userId, `Chat ${i}`),
      )

      // Save all concurrently
      await Promise.all(convs.map((c) => saveConversation(c)))

      const all = await getConversations(userId)
      expect(all).toHaveLength(5)
    })

    it('should handle save + read of same conversation', async () => {
      const conv = createConversationObject('user_1', 'Test')
      await saveConversation(conv)

      // Read and update concurrently
      const [read1, read2] = await Promise.all([getConversation(conv.id), getConversation(conv.id)])

      expect(read1).toBeDefined()
      expect(read2).toBeDefined()
      expect(read1!.id).toBe(read2!.id)
    })
  })

  // -----------------------------------------------
  // Large data handling
  // -----------------------------------------------
  describe('large data', () => {
    it('should handle conversation with many messages', async () => {
      const conv = createConversationObject('user_1')
      conv.messages = Array.from({ length: 200 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as StoredMessage['role'],
        content: `Message ${i}`,
      }))
      await saveConversation(conv)

      const retrieved = await getConversation(conv.id)
      expect(retrieved!.messages).toHaveLength(200)
    })
  })
})
