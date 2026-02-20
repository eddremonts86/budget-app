import 'dotenv/config'

// Default to LMStudio local endpoint
const EMBEDDING_API_URL = process.env.AI_EMBEDDING_URL || 'http://localhost:1234/v1/embeddings'
const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || 'text-embedding-nomic-embed-text-v1.5' // Example model name

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY || 'lm-studio'}`, // LMStudio doesn't check key usually
      },
      body: JSON.stringify({
        input: text,
        model: EMBEDDING_MODEL,
      }),
    })

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`)
    }

    const data = await response.json()
    // Handle both OpenAI-compatible format and raw array if applicable
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data[0].embedding
    }
    
    // Fallback if structure is different
    return []
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating embedding:', error)
    // Return a zero vector or throw depending on resilience needs
    // For now, return empty to handle gracefully upstream
    return []
  }
}
