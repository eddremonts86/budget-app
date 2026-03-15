export interface IncomingChatMessage {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content?: string
  parts?: Array<
    | { type: 'text'; content: string }
    | { type: 'image'; image: string }
    | { type: 'thinking'; content: string }
  >
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  parts?: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }>
}

export function normalizeIncomingChatMessages(rawMessages: IncomingChatMessage[]): ChatMessage[] {
  return rawMessages
    .map((message) => {
      const role: ChatMessage['role'] = message.role

      if (!Array.isArray(message.parts)) {
        const parts: ChatMessage['parts'] = [{ type: 'text', text: message.content || '' }]

        return {
          role,
          content: message.content || '',
          parts,
        }
      }

      const hasMultimodal = message.parts.some((part) => part.type === 'image')
      const content = message.parts
        .map((part) => {
          if (part.type === 'text') return part.content
          if (part.type === 'image') return '[Image Attached]'
          return ''
        })
        .join('\n')

      if (!hasMultimodal) {
        const parts: ChatMessage['parts'] = [{ type: 'text', text: content }]

        return {
          role,
          content,
          parts,
        }
      }

      const parts: ChatMessage['parts'] = message.parts.map((part) => {
        if (part.type === 'text') return { type: 'text' as const, text: part.content }
        if (part.type === 'image') return { type: 'image' as const, image: part.image }
        return { type: 'text' as const, text: '' }
      })

      return { role, content, parts }
    })
    .filter((message) => {
      return (
        message.content.length > 0 || (Array.isArray(message.parts) && message.parts.length > 0)
      )
    })
}

export function consolidateChatMessages(messages: ChatMessage[]): ChatMessage[] {
  const result: ChatMessage[] = []

  for (const message of messages) {
    if (result.length === 0) {
      result.push(message)
      continue
    }

    const lastMessage = result[result.length - 1]
    if (lastMessage.role !== message.role) {
      result.push(message)
      continue
    }

    const lastParts = lastMessage.parts || [{ type: 'text' as const, text: lastMessage.content }]
    const currentParts = message.parts || [{ type: 'text' as const, text: message.content }]

    result[result.length - 1] = {
      role: lastMessage.role,
      content: `${lastMessage.content}\n\n${message.content}`,
      parts: [...lastParts, ...currentParts],
    }
  }

  return result
}

export function findLastUserQuery(messages: ChatMessage[]): string | undefined {
  return messages
    .slice()
    .reverse()
    .find((message) => message.role === 'user' && message.content.length > 0)?.content
}

export async function isDashboardDomainQuery(query?: string): Promise<boolean> {
  if (!query) {
    return false
  }

  const { detectActionIntent, detectIntent } = await import('@/modules/ai/rag/context')
  const intents = detectIntent(query)
  const actionIntent = detectActionIntent(query)

  return intents.length > 0 || actionIntent !== null
}

export async function injectReferenceContext(
  messages: ChatMessage[],
  locale: string,
): Promise<string> {
  const query = findLastUserQuery(messages)
  if (!query) {
    return ''
  }

  const shouldInjectAppContext = await isDashboardDomainQuery(query)
  if (!shouldInjectAppContext) {
    return query
  }

  const [{ retrieveContext }, { injectDynamicContext }] = await Promise.all([
    import('@/modules/ai/rag/retrieval'),
    import('@/modules/ai/rag/context'),
  ])

  const ragContext = await retrieveContext(query)
  const dynamicContext = await injectDynamicContext(query, locale)
  if (!ragContext && !dynamicContext) {
    return query
  }

  const contextParts = [
    ragContext ? `Documentation:\n${ragContext}` : '',
    dynamicContext ? `Application Data:\n${dynamicContext}` : '',
  ].filter(Boolean)

  const contextMessage: ChatMessage = {
    role: 'user',
    content: `Use the following reference information to answer the user's question accurately. Base your answer on this data when relevant:\n\n${contextParts.join('\n\n')}`,
  }

  let lastUserIndex = -1
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user' && messages[index].content) {
      lastUserIndex = index
      break
    }
  }

  if (lastUserIndex >= 0) {
    messages.splice(lastUserIndex, 0, contextMessage)
  }

  return query
}
