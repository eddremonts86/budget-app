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

  // 2. Ingest App Knowledge Base
  try {
    const knowledgePath = 'mocks/app-knowledge.json'
    const knowledgeContent = await fs.readFile(knowledgePath, 'utf-8')
    const knowledge = JSON.parse(knowledgeContent)

    // Ingest navigation items individually for better retrieval
    if (knowledge.navigation?.main) {
      for (const item of knowledge.navigation.main) {
        const doc = [
          `Page: ${item.label} (${item.labelEs})`,
          `URL: ${item.url}`,
          `Description: ${item.description}`,
          `Descripción: ${item.descriptionEs}`,
        ].join('\n')

        const embedding = await generateEmbedding(doc)
        await collection.upsert({
          ids: [`nav-${item.url}`],
          embeddings: [embedding],
          metadatas: [{ source: knowledgePath, type: 'navigation', url: item.url }],
          documents: [doc],
        })
      }
      console.log('  Processed navigation items')
    }

    // Ingest page details
    if (knowledge.pages) {
      for (const [url, page] of Object.entries(knowledge.pages)) {
        const p = page as { title: string; titleEs: string; features: string[]; actions?: string[] }
        const doc = [
          `Page: ${p.title} (${p.titleEs})`,
          `URL: ${url}`,
          `Features: ${p.features.join('; ')}`,
          p.actions ? `Actions: ${p.actions.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n')

        const embedding = await generateEmbedding(doc)
        await collection.upsert({
          ids: [`page-${url}`],
          embeddings: [embedding],
          metadatas: [{ source: knowledgePath, type: 'page', url }],
          documents: [doc],
        })
      }
      console.log('  Processed page details')
    }

    // Ingest common Q&A pairs
    if (knowledge.commonQuestions) {
      const allQA: Array<{ key: string; answer: string }> = []
      for (const [, answers] of Object.entries(knowledge.commonQuestions)) {
        for (const [key, answer] of Object.entries(answers as Record<string, string>)) {
          allQA.push({ key, answer })
        }
      }
      for (const qa of allQA) {
        const embedding = await generateEmbedding(qa.answer)
        await collection.upsert({
          ids: [`qa-${qa.key}`],
          embeddings: [embedding],
          metadatas: [{ source: knowledgePath, type: 'qa', key: qa.key }],
          documents: [qa.answer],
        })
      }
      console.log('  Processed Q&A pairs')
    }

    console.log('✅ App knowledge base ingested')
  } catch (error) {
    console.warn('⚠️ Could not process app-knowledge.json, skipping.', error)
  }

  // 3. Ingest DB Schema (Mock)
  try {
    const dbPath = 'mocks/db.json'
    const dbContent = await fs.readFile(dbPath, 'utf-8')
    const dbSchema = JSON.parse(dbContent)

    const tables = Object.keys(dbSchema)

    for (const table of tables) {
      if (!Array.isArray(dbSchema[table])) {
        console.warn(`  ⚠️ Skipping table ${table} as it is not an array`)
        continue
      }

      const sampleData = dbSchema[table].slice(0, 3)
      const description = `Table: ${table}. Total records: ${dbSchema[table].length}. Structure based on sample: ${JSON.stringify(sampleData)}`

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

  // 4. Ingest Source Code (Key files)
  const codeFiles = await glob('src/features/**/*.tsx')
  console.log(`found ${codeFiles.length} feature files`)

  for (const file of codeFiles) {
    const content = await fs.readFile(file, 'utf-8')
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
