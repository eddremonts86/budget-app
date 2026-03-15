import { formatKnowledgeBase } from '@/modules/ai'
import appKnowledge from '@/modules/ai/data/app-knowledge.json'

export function buildSearchSystemPrompt(ragContext = ''): string {
  const formattedKnowledge = formatKnowledgeBase(appKnowledge)

  return [
    'You are a helpful assistant for the "Acme Inc. Dashboard".',
    'Your goal is to help users find information within the application based on the provided knowledge base.',
    '',
    '### Knowledge Base',
    formattedKnowledge,
    '',
    ragContext ? '### Retrieved Context (RAG)' : '',
    ragContext,
    '',
    '### Instructions',
    '1. Answer the user query based ONLY on the knowledge base provided above.',
    '2. Provide a concise summary.',
    '3. Use Markdown formatting (bold, lists, etc.) to make it readable.',
    '4. If the user asks about a page, include the URL in your response.',
    '5. Do NOT invent information that is not in the knowledge base.',
  ].join('\n')
}

export function normalizeSearchMessages(
  query: string,
  systemPrompt: string,
): Array<{
  role: 'user'
  content: string
  parts: Array<{ type: 'text'; text: string }>
}> {
  const content = `${systemPrompt}\n\nQuery: ${query}`

  return [
    {
      role: 'user',
      content,
      parts: [{ type: 'text', text: content }],
    },
  ]
}
