import { getCollection } from './chroma-client'
import { generateEmbedding } from './embeddings'

export async function syncRagDocument(
  entityType: 'todo' | 'user' | 'project' | 'transaction' | 'category' | 'team',
  id: string,
  content: string
) {
  try {
    const collection = await getCollection()
    const embedding = await generateEmbedding(content)
    
    await collection.upsert({
      ids: [`${entityType}-${id}`],
      embeddings: [embedding],
      metadatas: [{ source: 'postgres-sync', type: entityType, id }],
      documents: [content],
    })
    
     
    console.log(`✅ Synced ${entityType} ${id} to RAG`)
  } catch (error) {
     
    console.error(`❌ Failed to sync ${entityType} ${id} to RAG:`, error)
  }
}

export async function deleteRagDocument(
  entityType: 'todo' | 'user' | 'project' | 'transaction' | 'category' | 'team',
  id: string
) {
  try {
    const collection = await getCollection()
    await collection.delete({
      ids: [`${entityType}-${id}`],
    })
    
     
    console.log(`🗑️ Deleted ${entityType} ${id} from RAG`)
  } catch (error) {
     
    console.error(`❌ Failed to delete ${entityType} ${id} from RAG:`, error)
  }
}
