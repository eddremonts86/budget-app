/* eslint-disable no-console */
import fs from 'fs/promises'
import { glob } from 'glob'
import { getCollection } from '../src/shared/lib/rag/chroma-client'
import { generateEmbedding } from '../src/shared/lib/rag/embeddings'

async function ingest() {
  console.log('🚀 Starting RAG ingestion...')

  const collection = await getCollection()
  console.log('✅ Connected to ChromaDB')

  // 1. Ingest Documentation (Markdown)
  const docFiles = await glob('docs/**/*.md')
  console.log(`found ${docFiles.length} documentation files`)

  for (const file of docFiles) {
    const content = await fs.readFile(file, 'utf-8')
    const chunks = chunkText(content, 500) // Simple chunking

    for (const [index, chunk] of chunks.entries()) {
      const embedding = await generateEmbedding(chunk)
      await collection.upsert({
        ids: [`doc-${file}-${index}`],
        embeddings: [embedding],
        metadatas: [{ source: file, type: 'documentation', index }],
        documents: [chunk],
      })
    }
    console.log(`  Processed ${file}`)
  }

  // 2. Ingest DB Schema (Mock)
  try {
    const dbPath = 'mocks/db.json'
    const dbContent = await fs.readFile(dbPath, 'utf-8')
    const dbSchema = JSON.parse(dbContent)

    // Flatten schema for better retrieval
    // Assuming typical json-server structure: { "posts": [...], "comments": [...] }
    const tables = Object.keys(dbSchema)

    for (const table of tables) {
      // Ensure it's an array before slicing
      if (!Array.isArray(dbSchema[table])) {
        console.warn(`  ⚠️ Skipping table ${table} as it is not an array`)
        continue
      }

      const sampleData = dbSchema[table].slice(0, 3) // Take first 3 items as sample
      const description = `Table: ${table}. Structure based on sample: ${JSON.stringify(sampleData)}`
      
      const embedding = await generateEmbedding(description)
      await collection.upsert({
        ids: [`schema-${table}`],
        embeddings: [embedding],
        metadatas: [{ source: dbPath, type: 'schema', table }],
        documents: [description],
      })
      console.log(`  Processed schema for table: ${table}`)
    }
  } catch (error) {
    console.warn('⚠️ Could not process mocks/db.json, skipping schema ingestion.', error)
  }

  // 3. Ingest Source Code (Key files)
  // Limit to specific directories to avoid indexing everything
  const codeFiles = await glob('src/features/**/*.tsx') // Focus on features
  console.log(`found ${codeFiles.length} feature files`)

  for (const file of codeFiles) {
    const content = await fs.readFile(file, 'utf-8')
    // Only index if file is not too large
    if (content.length > 10000) continue

    const chunks = chunkText(content, 800)
    for (const [index, chunk] of chunks.entries()) {
      const embedding = await generateEmbedding(chunk)
      await collection.upsert({
        ids: [`code-${file}-${index}`],
        embeddings: [embedding],
        metadatas: [{ source: file, type: 'code', index }],
        documents: [chunk],
      })
    }
    console.log(`  Processed ${file}`)
  }

  console.log('🎉 Ingestion complete!')
}

function chunkText(text: string, size: number): string[] {
  const chunks = []
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

ingest().catch(console.error)
