import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'

type ChatRequestBody = {
  messages: Array<{
    role: 'user' | 'assistant' | 'tool' | 'system'
    content?: string
    parts?: Array<
      | { type: 'text'; content: string }
      | { type: 'image'; image: string }
      | { type: 'thinking'; content: string }
    >
  }>
  conversationId?: string
  providerId?: AiProviderId
  model?: string
  params?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
}

const normalizeBaseUrl = (baseUrl: string) => {
  let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  if (url.endsWith('/api/v1')) {
    url = url.replace('/api/v1', '/v1')
  }
  return url
}

type ChatMessage = {
  role: 'user' | 'assistant' | 'tool'
  content: string
  parts?: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }>
}

type ExtendedModelOptions = {
  temperature?: number
  max_tokens?: number
  max_output_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  thinking?: {
    type: 'enabled'
    budget_tokens: number
  }
}

const localeToLanguage: Record<string, string> = {
  en: 'English',
  'en-US': 'English',
  'en-GB': 'English',
  es: 'Spanish',
  'es-ES': 'Spanish',
  'es-MX': 'Spanish',
  dk: 'Danish',
  'da-DK': 'Danish',
}

const resolveLanguageName = (locale: string) =>
  localeToLanguage[locale] || localeToLanguage[locale.split('-')[0]] || 'English'

const buildSystemPrompt = (languageName: string) => {
  return [
    `You are a helpful, knowledgeable AI assistant for the "Acme Inc." dashboard application.`,
    `You have access to application data (users, tasks, transactions, categories) and know the app's navigation structure.`,
    ``,
    `RULES:`,
    `1. LANGUAGE: Always respond in ${languageName}.`,
    `2. Answer the question the user asked. Do NOT say "no question was provided" or give generic greetings.`,
    `3. When application data is provided as context, use it to give specific answers with numbers.`,
    `4. When referring to app sections, ALWAYS include the URL path (e.g., /dashboard/todos, /dashboard/users).`,
    `5. When listing items, be specific with counts, names and details from the provided data.`,
    `6. Use Markdown for formatting when helpful.`,
  ].join('\n')
}

const normalizeIncomingMessages = (rawMessages: ChatRequestBody['messages']): ChatMessage[] => {
  return rawMessages
    .map((msg) => {
      const role: ChatMessage['role'] = msg.role === 'system' ? 'user' : msg.role

      if (!Array.isArray(msg.parts)) {
        return {
          role,
          content: msg.content || '',
          parts: [{ type: 'text' as const, text: msg.content || '' }],
        }
      }

      const hasMultimodal = msg.parts.some((part) => part.type === 'image')
      const content = msg.parts
        .map((part) => {
          if (part.type === 'text') return part.content
          if (part.type === 'image') return '[Image Attached]'
          return ''
        })
        .join('\n')

      if (!hasMultimodal) {
        return {
          role,
          content,
          parts: [{ type: 'text' as const, text: content }],
        }
      }

      const parts = msg.parts.map((part) => {
        if (part.type === 'text') return { type: 'text' as const, text: part.content }
        if (part.type === 'image') return { type: 'image' as const, image: part.image }
        return { type: 'text' as const, text: '' }
      })

      return { role, content, parts }
    })
    .filter((msg) => msg.content.length > 0 || (Array.isArray(msg.parts) && msg.parts.length > 0))
}

const consolidateMessages = (messages: ChatMessage[]): ChatMessage[] => {
  const result: ChatMessage[] = []

  for (const message of messages) {
    if (result.length === 0) {
      result.push(message)
      continue
    }

    const last = result[result.length - 1]
    if (last.role === message.role) {
      // Merge content
      const newContent = `${last.content}\n\n${message.content}`

      // Merge parts if they exist
      let newParts: ChatMessage['parts'] = []
      const lastParts = last.parts || [{ type: 'text' as const, text: last.content }]
      const messageParts = message.parts || [{ type: 'text' as const, text: message.content }]
      newParts = [...lastParts, ...messageParts]

      result[result.length - 1] = {
        role: last.role,
        content: newContent,
        parts: newParts,
      }
    } else {
      result.push(message)
    }
  }
  return result
}

const findLastUserQuery = (messages: ChatMessage[]) => {
  const lastUserMessage = messages
    .slice()
    .reverse()
    .find((message) => message.role === 'user' && message.content.length > 0)
  return lastUserMessage?.content
}

const injectReferenceContext = async (messages: ChatMessage[], locale: string) => {
  const query = findLastUserQuery(messages)
  if (!query) return ''

  const [{ retrieveContext }, { injectDynamicContext }] = await Promise.all([
    import('@/shared/lib/rag/retrieval'),
    import('@/shared/lib/rag/context'),
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
    content: `Use the following reference information to answer the user's question accurately. Base your answer on this data when relevant:

${contextParts.join('\n\n')}`,
  }

  let lastUserIndex = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && !!messages[i].content) {
      lastUserIndex = i
      break
    }
  }

  if (lastUserIndex >= 0) {
    messages.splice(lastUserIndex, 0, contextMessage)
  }

  return query
}

const buildModelOptions = (
  providerId: AiProviderId,
  body: ChatRequestBody,
  config: AiConfigFormData,
): ExtendedModelOptions => {
  const maxTokens = body.params?.maxTokens ?? config.parameters.max_tokens

  const options: ExtendedModelOptions = {
    temperature: body.params?.temperature ?? config.parameters.temperature,
    top_p: body.params?.topP ?? config.parameters.top_p,
    frequency_penalty: config.parameters.frequency_penalty,
    presence_penalty: config.parameters.presence_penalty,
  }

  if (providerId === 'openai') {
    options.max_output_tokens = maxTokens
  } else {
    options.max_tokens = maxTokens
  }

  if (providerId === 'anthropic') {
    options.thinking = {
      type: 'enabled',
      budget_tokens: Math.floor((options.max_tokens ?? 2048) / 2),
    }
  }

  return options
}

const mapFinishReason = (finishReason: string | null | undefined) => {
  if (finishReason === 'stop') return 'stop' as const
  if (finishReason === 'length') return 'length' as const
  if (finishReason === 'tool_calls') return 'tool_calls' as const
  if (finishReason === 'content_filter') return 'content_filter' as const
  return 'stop' as const
}

type LmStudioUsage = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

type LmStudioStreamState = {
  model: string
  accumulatedContent: string
  emittedRunStarted: boolean
  emittedTextStart: boolean
  emittedRunFinished: boolean
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter'
  usage?: LmStudioUsage
}

const buildRunStartedChunk = (runId: string, model: string) => ({
  type: 'RUN_STARTED' as const,
  runId,
  model,
  timestamp: Date.now(),
})

const buildTextStartChunk = (messageId: string, model: string) => ({
  type: 'TEXT_MESSAGE_START' as const,
  messageId,
  model,
  timestamp: Date.now(),
  role: 'assistant' as const,
})

const buildRunFinishedChunk = (
  runId: string,
  model: string,
  finishReason: LmStudioStreamState['finishReason'],
  usage?: LmStudioUsage,
) => ({
  type: 'RUN_FINISHED' as const,
  runId,
  model,
  timestamp: Date.now(),
  finishReason,
  usage,
})

const extractSsePayload = (eventBlock: string): string | null => {
  const dataLines = eventBlock
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())

  if (dataLines.length === 0) return null

  const payload = dataLines.join('\n')
  return payload || null
}

const parseJsonPayload = (payload: string) => {
  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateStreamStateFromPayload = (state: LmStudioStreamState, payload: Record<string, any>) => {
  if (typeof payload.model === 'string' && payload.model.length > 0) {
    state.model = payload.model
  }

  if (payload.usage && typeof payload.usage === 'object') {
    state.usage = {
      promptTokens: Number(payload.usage.prompt_tokens ?? 0),
      completionTokens: Number(payload.usage.completion_tokens ?? 0),
      totalTokens: Number(payload.usage.total_tokens ?? 0),
    }
  }
}

const appendDeltaChunks = (
  state: LmStudioStreamState,
  chunks: Array<Record<string, unknown>>,
  messageId: string,
  deltaContent: string,
) => {
  if (deltaContent.length === 0) return

  if (!state.emittedTextStart) {
    state.emittedTextStart = true
    chunks.push(buildTextStartChunk(messageId, state.model))
  }

  state.accumulatedContent += deltaContent
  chunks.push({
    type: 'TEXT_MESSAGE_CONTENT',
    messageId,
    model: state.model,
    timestamp: Date.now(),
    delta: deltaContent,
    content: state.accumulatedContent,
  })
}

const appendRunFinishedChunk = (
  state: LmStudioStreamState,
  chunks: Array<Record<string, unknown>>,
  runId: string,
  finishReason: string | null | undefined,
) => {
  if (typeof finishReason !== 'string' || finishReason.length === 0 || state.emittedRunFinished) {
    return
  }

  state.finishReason = mapFinishReason(finishReason)
  state.emittedRunFinished = true
  chunks.push(buildRunFinishedChunk(runId, state.model, state.finishReason, state.usage))
}

const processLmStudioSseEvent = (
  state: LmStudioStreamState,
  runId: string,
  messageId: string,
  eventBlock: string,
): Array<Record<string, unknown>> => {
  const payload = extractSsePayload(eventBlock)
  if (!payload) return []

  if (payload === '[DONE]') {
    if (state.emittedRunFinished || !state.emittedRunStarted) return []
    state.emittedRunFinished = true
    return [buildRunFinishedChunk(runId, state.model, state.finishReason, state.usage)]
  }

  const parsed = parseJsonPayload(payload)
  if (!parsed) return []

  updateStreamStateFromPayload(state, parsed)

  const chunks: Array<Record<string, unknown>> = []
  if (!state.emittedRunStarted) {
    state.emittedRunStarted = true
    chunks.push(buildRunStartedChunk(runId, state.model))
  }

  const choice = Array.isArray(parsed.choices) ? parsed.choices[0] : null
  if (!choice || typeof choice !== 'object') {
    return chunks
  }

  const deltaContent =
    typeof choice.delta?.content === 'string' ? (choice.delta.content as string) : ''

  appendDeltaChunks(state, chunks, messageId, deltaContent)
  appendRunFinishedChunk(state, chunks, runId, choice.finish_reason)

  return chunks
}

const splitSseBlocks = (buffer: string) => {
  const chunks: string[] = []
  let remaining = buffer

  while (remaining.includes('\n\n')) {
    const separatorIndex = remaining.indexOf('\n\n')
    chunks.push(remaining.slice(0, separatorIndex))
    remaining = remaining.slice(separatorIndex + 2)
  }

  return { chunks, remaining }
}

const collectChunksFromBuffer = (
  state: LmStudioStreamState,
  runId: string,
  messageId: string,
  buffer: string,
) => {
  const parsed = splitSseBlocks(buffer)
  const chunks = parsed.chunks.flatMap((eventBlock) =>
    processLmStudioSseEvent(state, runId, messageId, eventBlock),
  )

  return { chunks, remaining: parsed.remaining }
}

const createLmStudioAgUiStream = async function* (
  lmStream: ReadableStream<Uint8Array>,
  initialModel: string,
) {
  const runId = crypto.randomUUID()
  const messageId = crypto.randomUUID()
  const decoder = new TextDecoder()
  const reader = lmStream.getReader()

  let buffer = ''
  const state: LmStudioStreamState = {
    model: initialModel,
    accumulatedContent: '',
    emittedRunStarted: false,
    emittedTextStart: false,
    emittedRunFinished: false,
    finishReason: 'stop',
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const parsed = collectChunksFromBuffer(state, runId, messageId, buffer)
      buffer = parsed.remaining
      for (const chunk of parsed.chunks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yield chunk as any
      }
    }

    buffer += decoder.decode()
    if (buffer.trim().length > 0) {
      const tailChunks = processLmStudioSseEvent(state, runId, messageId, buffer)
      for (const chunk of tailChunks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yield chunk as any
      }
    }

    if (!state.emittedRunFinished && state.emittedRunStarted) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yield buildRunFinishedChunk(runId, state.model, state.finishReason, state.usage) as any
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown LM Studio stream error'
    const errorChunk = {
      type: 'RUN_ERROR',
      runId,
      model: state.model,
      timestamp: Date.now(),
      error: {
        message,
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yield errorChunk as any
  } finally {
    reader.releaseLock()
  }
}

const streamLmStudioChat = async (
  config: AiConfigFormData,
  body: ChatRequestBody,
  messages: ChatMessage[],
) => {
  const { getProviderHeaders } = await import('@/shared/lib/ai/server/providers')

  const baseUrl = normalizeBaseUrl(config.baseUrl)
  const chatEndpoint = config.endpoints.chat.startsWith('/')
    ? config.endpoints.chat
    : `/${config.endpoints.chat}`

  const payloadMessages = messages
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
    .filter((message) => message.content.length > 0)

  const response = await fetch(`${baseUrl}${chatEndpoint}`, {
    method: 'POST',
    headers: getProviderHeaders(config),
    body: JSON.stringify({
      model: body.model ?? config.parameters.model,
      messages: payloadMessages,
      temperature: body.params?.temperature ?? config.parameters.temperature,
      max_tokens: body.params?.maxTokens ?? config.parameters.max_tokens,
      top_p: body.params?.topP ?? config.parameters.top_p,
      frequency_penalty: config.parameters.frequency_penalty,
      presence_penalty: config.parameters.presence_penalty,
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    const errorText = await response.text()
    return new Response(JSON.stringify({ error: errorText || 'LMSTUDIO_CHAT_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stream = createLmStudioAgUiStream(response.body, body.model ?? config.parameters.model)
  return toServerSentEventsResponse(stream)
}

export const handleChatPost = async ({ request }: { request: Request }) => {
  try {
    const [
      { logAudit },
      { getActiveAiConfig, getAllAiConfigs, validateAiConfig },
      { detectBestProvider, getProvider, probeProvider },
    ] = await Promise.all([
      import('@/shared/lib/ai/audit'),
      import('@/shared/lib/ai/server/config-store'),
      import('@/shared/lib/ai/server/providers'),
    ])

    const body = (await request.json()) as ChatRequestBody
    const rawMessages = Array.isArray(body.messages) ? body.messages : []

    const messages = normalizeIncomingMessages(rawMessages)
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'MISSING_MESSAGES' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(request.url)
    const locale = url.searchParams.get('locale') || 'en-US'

    const systemPrompt = buildSystemPrompt(resolveLanguageName(locale))

    // Ensure system message is first
    messages.unshift({
      role: 'user',
      content: systemPrompt,
    })

    const config = await getActiveAiConfig()
    const validation = validateAiConfig(config)

    // Fallback logic
    let providerId: AiProviderId | undefined = body.providerId ?? config.provider
    let finalConfig = config

    if (providerId) {
      // Check if the requested provider is actually available
      const allConfigs = await getAllAiConfigs()
      const targetConfig = allConfigs.providers[providerId]

      if (targetConfig) {
        const status = await probeProvider(targetConfig)
        if (!status.available) {
          // eslint-disable-next-line no-console
          console.warn(
            `[AI] Provider ${providerId} is unavailable (${status.message}). Attempting fallback...`,
          )
          providerId = undefined // Trigger fallback
        } else {
          // If available, make sure we use its config (in case body.providerId differed from active config)
          finalConfig = targetConfig
        }
      }
    }

    if (!providerId) {
      const detection = await detectBestProvider()
      providerId = detection.provider ?? undefined

      if (providerId) {
        const allConfigs = await getAllAiConfigs()
        finalConfig = allConfigs.providers[providerId]
      }
    }

    if (!providerId) {
      return new Response(JSON.stringify({ error: 'NO_PROVIDER_AVAILABLE' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const lastUserQuery = await injectReferenceContext(messages, locale)

    // Consolidate messages to merge consecutive user/assistant messages
    // This is crucial for providers like Anthropic that disallow consecutive user messages
    const consolidatedMessages = consolidateMessages(messages)

    // Audit Log
    logAudit({
      timestamp: new Date().toISOString(),
      locale,
      query: lastUserQuery ? `${String(lastUserQuery).slice(0, 50)}...` : 'No content',
      providerId: providerId || 'unknown',
      model: body.model ?? finalConfig.parameters.model ?? 'unknown',
      contextLength: 0,
      // eslint-disable-next-line no-console
    }).catch((err) => console.error('Audit log failed:', err))

    const provider = getProvider(providerId)
    if (!provider) {
      return new Response(JSON.stringify({ error: 'UNKNOWN_PROVIDER' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (providerId === 'lm-studio') {
      return await streamLmStudioChat(finalConfig, body, consolidatedMessages)
    }

    const adapter = provider.buildAdapter(finalConfig)(body.model ?? finalConfig.parameters.model)

    const modelOptions = buildModelOptions(providerId, body, finalConfig)

    const stream = chat({
      adapter,
      messages: consolidatedMessages,
      conversationId: body.conversationId,
      modelOptions: modelOptions as Parameters<typeof chat>[0]['modelOptions'],
    })
    return toServerSentEventsResponse(stream)
  } catch (error) {
    console.error('[AI Chat Error]', error)
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    const stack = error instanceof Error ? error.stack : undefined
    return new Response(JSON.stringify({ error: message, stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const Route = createFileRoute('/api/ai/chat')({
  component: () => null,
  server: {
    handlers: {
      POST: handleChatPost,
    },
  },
})
