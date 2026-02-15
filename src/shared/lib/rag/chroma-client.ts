import { ChromaClient } from 'chromadb'

export const chromaClient = new ChromaClient({
  path: process.env.CHROMADB_URL || 'http://localhost:8000',
})

export const COLLECTION_NAME = 'tanstack-template-rag'

export async function getCollection() {
  return await chromaClient.getOrCreateCollection({
    name: COLLECTION_NAME,
  })
}
