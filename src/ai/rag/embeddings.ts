let localEmbedderPromise: Promise<{
  generate: (texts: string[]) => Promise<number[][]>
}> | null = null

const getLocalEmbedder = async () => {
  if (!localEmbedderPromise) {
    localEmbedderPromise = import('@chroma-core/default-embed').then(
      ({ DefaultEmbeddingFunction }) =>
        new DefaultEmbeddingFunction({
          dtype: 'uint8',
        }),
    )
  }

  return await localEmbedderPromise
}

const generateLocalEmbedding = async (text: string) => {
  const embedder = await getLocalEmbedder()
  const embeddings = await embedder.generate([text])
  return embeddings[0] ?? []
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const EMBEDDING_API_URL = process.env.AI_EMBEDDING_URL || 'http://localhost:1234/v1/embeddings'
  const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || 'text-embedding-nomic-embed-text-v1.5'
  const controller = new AbortController()
  const timeoutMs = Number(process.env.AI_EMBEDDING_TIMEOUT_MS || 4000)
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_API_KEY || 'lm-studio'}`, // LMStudio doesn't check key usually
      },
      signal: controller.signal,
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

    return await generateLocalEmbedding(text)
  } catch (error) {
     
    console.error('Error generating embedding:', error)
    return await generateLocalEmbedding(text)
  } finally {
    clearTimeout(timeoutId)
  }
}
