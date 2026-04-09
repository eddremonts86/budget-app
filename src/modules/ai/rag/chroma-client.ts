import type { ChromaClient } from 'chromadb'

let chromaClientInstance: ChromaClient | null = null

export const getChromaClient = async () => {
  if (!chromaClientInstance) {
    const { ChromaClient } = await import('chromadb')
    chromaClientInstance = new ChromaClient({
      path: process.env.CHROMADB_URL || 'http://localhost:8000',
    })
  }
  return chromaClientInstance
}

export const COLLECTION_NAME = 'tanstack-template-rag'

export async function getCollection() {
  const client = await getChromaClient()
  return await client.getOrCreateCollection({
    name: COLLECTION_NAME,
  })
}
