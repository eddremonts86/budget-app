import { formatKnowledgeBase } from '@/modules/ai/api/search.fn'
import appKnowledge from '@/modules/ai/data/app-knowledge.json'

export function buildSearchSystemPrompt(ragContext = ''): string {
  const formattedKnowledge = formatKnowledgeBase(appKnowledge)

  return [
    'You are a helpful AI assistant for the "Acme Inc. Dashboard".',
    'You help users navigate the application AND answer general questions.',
    '',
    '### Application Knowledge Base',
    formattedKnowledge,
    '',
    ragContext ? '### Retrieved Context' : '',
    ragContext,
    '',
    '### Instructions',
    '1. If the user asks about a page, section, or feature of the application, use the knowledge base to answer with the correct URL.',
    '2. If the user asks a general knowledge question (not specific to the app), answer it directly and accurately.',
    '3. Use Markdown formatting (bold, lists, etc.) to make responses readable.',
    '4. Be concise and helpful.',
  ].join('\n')
}

export function normalizeSearchMessages(
  query: string,
  systemPrompt: string,
): Array<{
  role: 'user' | 'system'
  content: string
}> {
  return [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: query,
    },
  ]
}
