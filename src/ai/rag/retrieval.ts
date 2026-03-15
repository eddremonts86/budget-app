import { getCollection } from './chroma-client'
import { generateEmbedding } from './embeddings'

export async function retrieveContext(query: string, limit = 5): Promise<string> {
  try {
    const embedding = await generateEmbedding(query)
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return ''
    }

    const collection = await getCollection()

    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: limit,
    })

    if (!results.documents[0] || results.documents[0].length === 0) {
      return ''
    }

    // Format the results
    return results.documents[0]
      .map((doc, index) => {
        const metadata = results.metadatas[0]?.[index]
        const source = metadata ? `Source: ${metadata.source} (${metadata.type})` : ''
        return `[Context ${index + 1}] ${source}\n${doc}`
      })
      .join('\n\n')
  } catch (error) {
     
    console.error('Error retrieving context:', error)
    return '' // Fail gracefully
  }
}
