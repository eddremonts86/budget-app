/* eslint-disable no-console */
import fs from 'fs/promises'
import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { glob } from 'glob'
import postgres from 'postgres'
import * as schema from '../src/shared/lib/db/schema'
import { getCollection } from '../src/shared/lib/rag/chroma-client'
import { generateEmbedding } from '../src/shared/lib/rag/embeddings'

dotenv.config()

async function ingest() {
  console.log('🚀 Starting RAG ingestion...')

  const collection = await getCollection()
  console.log('✅ Connected to ChromaDB')

  // Connect to DB
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.warn('⚠️ DATABASE_URL not found, skipping DB ingestion')
  } else {
    try {
      const client = postgres(connectionString)
      const db = drizzle(client, { schema })
      console.log('✅ Connected to PostgreSQL')

      // 1. Ingest Users
      const users = await db.select().from(schema.users)
      console.log(`Found ${users.length} users in DB`)

      for (const user of users) {
        const doc = `User: ${user.name} (${user.email}). Role: ${user.role}. ID: ${user.id}`
        const embedding = await generateEmbedding(doc)
        await collection.upsert({
          ids: [`user-${user.id}`],
          embeddings: [embedding],
          metadatas: [{ source: 'postgres', type: 'user', id: user.id }],
          documents: [doc],
        })
      }

      // 2. Ingest Todos
      const todos = await db.select().from(schema.todos)
      console.log(`Found ${todos.length} todos in DB`)

      for (const todo of todos) {
        const doc = `Task: ${todo.title}. Status: ${todo.status}. Priority: ${todo.priority}. Assigned to: ${todo.assignedTo || 'Unassigned'}. Due: ${todo.dueDate || 'No date'}. Description: ${todo.description || ''}`
        const embedding = await generateEmbedding(doc)
        await collection.upsert({
          ids: [`todo-${todo.id}`],
          embeddings: [embedding],
          metadatas: [{ source: 'postgres', type: 'todo', id: todo.id }],
          documents: [doc],
        })
      }

      // 3. Ingest Projects
      const projects = await db.select().from(schema.projects)
      console.log(`Found ${projects.length} projects in DB`)

      for (const project of projects) {
        const doc = `Project: ${project.name}. Status: ${project.status}. Description: ${project.description || ''}. Tech: ${project.technologies?.join(', ') || ''}`
        const embedding = await generateEmbedding(doc)
        await collection.upsert({
          ids: [`project-${project.id}`],
          embeddings: [embedding],
          metadatas: [{ source: 'postgres', type: 'project', id: project.id }],
          documents: [doc],
        })
      }

      // 4. Ingest Transactions
      const transactions = await db.select().from(schema.transactions)
      console.log(`Found ${transactions.length} transactions in DB`)

      for (const transaction of transactions) {
        const doc = `Transaction: ${transaction.customerName} (${transaction.customerEmail}). Status: ${transaction.status}. Amount: ${transaction.amount} cents. Date: ${transaction.date}. Rejection Reason: ${transaction.rejectionReason || 'None'}`
        const embedding = await generateEmbedding(doc)
        await collection.upsert({
          ids: [`transaction-${transaction.id}`],
          embeddings: [embedding],
          metadatas: [{ source: 'postgres', type: 'transaction', id: transaction.id }],
          documents: [doc],
        })
      }

      // 5. Ingest Categories
      const categories = await db.select().from(schema.categories)
      console.log(`Found ${categories.length} categories in DB`)

      for (const category of categories) {
        const doc = `Category: ${category.name}. Color: ${category.color}`
        const embedding = await generateEmbedding(doc)
        await collection.upsert({
          ids: [`category-${category.id}`],
          embeddings: [embedding],
          metadatas: [{ source: 'postgres', type: 'category', id: category.id }],
          documents: [doc],
        })
      }

      // 6. Ingest Teams
      const teams = await db.select().from(schema.teams)
      console.log(`Found ${teams.length} teams in DB`)

      for (const team of teams) {
        const doc = `Team: ${team.name}. Description: ${team.description || ''}. Members count: ${team.members?.length || 0}`
        const embedding = await generateEmbedding(doc)
        await collection.upsert({
          ids: [`team-${team.id}`],
          embeddings: [embedding],
          metadatas: [{ source: 'postgres', type: 'team', id: team.id }],
          documents: [doc],
        })
      }
    } catch (error) {
      console.error('❌ Error ingesting DB data:', error)
    }
  }

  // 4. Ingest Documentation (Markdown)
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

  // 5. Ingest App Knowledge Base
  try {
    const knowledgePath = 'src/server/data/app-knowledge.json'
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
