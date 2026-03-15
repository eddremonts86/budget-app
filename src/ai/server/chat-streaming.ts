import { toServerSentEventsResponse } from '@tanstack/ai'
import type { AGUIEvent } from '@tanstack/ai'
import type { AiConfigFormData, AiProviderId } from '@/ai/config'
import { getProviderHeaders } from '@/ai/providers'
import { buildProviderSpecificOptions } from '@/ai/server/provider-models'
import type { ChatMessage } from './chat-messages'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export type ChatRequestParams = {
  temperature?: number
  maxTokens?: number
  topP?: number
}

export type ExtendedModelOptions = {
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
  think?: boolean
  chat_template_kwargs?: {
    enable_thinking: boolean
  }
  reasoning_format?: 'none'
}

function normalizeBaseUrl(baseUrl?: string): string {
  if (!baseUrl) return ''

  let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  if (url.endsWith('/api/v1')) {
    url = url.replace('/api/v1', '/v1')
  }

  return url
}

function toServiceRootUrl(baseUrl?: string): string {
  const normalized = normalizeBaseUrl(baseUrl)
  if (normalized.endsWith('/v1')) {
    return normalized.slice(0, -'/v1'.length)
  }
  return normalized
}

function mapFinishReason(finishReason: string | null | undefined) {
  if (finishReason === 'stop') return 'stop' as const
  if (finishReason === 'length') return 'length' as const
  if (finishReason === 'tool_calls') return 'tool_calls' as const
  if (finishReason === 'content_filter') return 'content_filter' as const
  return 'stop' as const
}

type StreamUsage = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

type StreamState = {
  model: string
  accumulatedContent: string
  emittedRunStarted: boolean
  emittedTextStart: boolean
  emittedRunFinished: boolean
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter'
  usage?: StreamUsage
}

function buildRunStartedChunk(runId: string, model: string) {
  return {
    type: 'RUN_STARTED' as const,
    runId,
    model,
    timestamp: Date.now(),
  }
}

function buildTextStartChunk(messageId: string, model: string) {
  return {
    type: 'TEXT_MESSAGE_START' as const,
    messageId,
    model,
    timestamp: Date.now(),
    role: 'assistant' as const,
  }
}

function buildRunFinishedChunk(
  runId: string,
  model: string,
  finishReason: StreamState['finishReason'],
  usage?: StreamUsage,
) {
  return {
    type: 'RUN_FINISHED' as const,
    runId,
    model,
    timestamp: Date.now(),
    finishReason,
    usage,
  }
}

function parseJsonPayload(payload: string): Record<string, unknown> | null {
  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

function appendDeltaChunks(
  state: StreamState,
  chunks: Array<Record<string, unknown>>,
  messageId: string,
  deltaContent: string,
) {
  if (deltaContent.length === 0) {
    return
  }

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

function appendRunFinishedChunk(
  state: StreamState,
  chunks: Array<Record<string, unknown>>,
  runId: string,
  finishReason: string | null | undefined,
) {
  if (typeof finishReason !== 'string' || finishReason.length === 0 || state.emittedRunFinished) {
    return
  }

  state.finishReason = mapFinishReason(finishReason)
  state.emittedRunFinished = true
  chunks.push(buildRunFinishedChunk(runId, state.model, state.finishReason, state.usage))
}

function extractSsePayload(eventBlock: string): string | null {
  const dataLines = eventBlock
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())

  if (dataLines.length === 0) {
    return null
  }

  const payload = dataLines.join('\n')
  return payload || null
}

function splitSseBlocks(buffer: string): { chunks: string[]; remaining: string } {
  const chunks: string[] = []
  let remaining = buffer

  while (remaining.includes('\n\n')) {
    const separatorIndex = remaining.indexOf('\n\n')
    chunks.push(remaining.slice(0, separatorIndex))
    remaining = remaining.slice(separatorIndex + 2)
  }

  return { chunks, remaining }
}

function processLmStudioSseEvent(
  state: StreamState,
  runId: string,
  messageId: string,
  eventBlock: string,
): Array<Record<string, unknown>> {
  const payload = extractSsePayload(eventBlock)
  if (!payload) {
    return []
  }

  if (payload === '[DONE]') {
    if (state.emittedRunFinished || !state.emittedRunStarted) {
      return []
    }

    state.emittedRunFinished = true
    return [buildRunFinishedChunk(runId, state.model, state.finishReason, state.usage)]
  }

  const parsed = parseJsonPayload(payload)
  if (!parsed) {
    return []
  }

  if (typeof parsed.model === 'string' && parsed.model.length > 0) {
    state.model = parsed.model
  }

  const usage = isRecord(parsed.usage) ? parsed.usage : null
  if (usage) {
    state.usage = {
      promptTokens: Number(usage.prompt_tokens ?? 0),
      completionTokens: Number(usage.completion_tokens ?? 0),
      totalTokens: Number(usage.total_tokens ?? 0),
    }
  }

  const chunks: Array<Record<string, unknown>> = []
  if (!state.emittedRunStarted) {
    state.emittedRunStarted = true
    chunks.push(buildRunStartedChunk(runId, state.model))
  }

  const choice =
    Array.isArray(parsed.choices) && isRecord(parsed.choices[0]) ? parsed.choices[0] : null
  if (!choice) {
    return chunks
  }

  const delta = isRecord(choice.delta) ? choice.delta : null
  const deltaContent = typeof delta?.content === 'string' ? delta.content : ''
  appendDeltaChunks(state, chunks, messageId, deltaContent)
  appendRunFinishedChunk(
    state,
    chunks,
    runId,
    typeof choice.finish_reason === 'string' ? choice.finish_reason : undefined,
  )

  return chunks
}

async function* createLmStudioAgUiStream(
  lmStream: ReadableStream<Uint8Array>,
  initialModel: string,
): AsyncGenerator<AGUIEvent, void, void> {
  const runId = crypto.randomUUID()
  const messageId = crypto.randomUUID()
  const decoder = new TextDecoder()
  const reader = lmStream.getReader()

  let buffer = ''
  const state: StreamState = {
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
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const parsed = splitSseBlocks(buffer)
      buffer = parsed.remaining

      const chunks = parsed.chunks.flatMap((eventBlock) =>
        processLmStudioSseEvent(state, runId, messageId, eventBlock),
      )

      for (const chunk of chunks) {
        yield chunk as unknown as AGUIEvent
      }
    }

    buffer += decoder.decode()
    if (buffer.trim().length > 0) {
      const tailChunks = processLmStudioSseEvent(state, runId, messageId, buffer)
      for (const chunk of tailChunks) {
        yield chunk as unknown as AGUIEvent
      }
    }

    if (!state.emittedRunFinished && state.emittedRunStarted) {
      yield buildRunFinishedChunk(runId, state.model, state.finishReason, state.usage) as AGUIEvent
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown LM Studio stream error'
    yield {
      type: 'RUN_ERROR',
      runId,
      model: state.model,
      timestamp: Date.now(),
      error: { message },
    } as AGUIEvent
  } finally {
    reader.releaseLock()
  }
}

function processOllamaJsonLine(
  state: StreamState,
  runId: string,
  messageId: string,
  line: string,
): Array<Record<string, unknown>> {
  if (!line.trim()) {
    return []
  }

  const parsed = parseJsonPayload(line)
  if (!parsed) {
    return []
  }

  if (typeof parsed.model === 'string' && parsed.model.length > 0) {
    state.model = parsed.model
  }

  const chunks: Array<Record<string, unknown>> = []
  if (!state.emittedRunStarted) {
    state.emittedRunStarted = true
    chunks.push(buildRunStartedChunk(runId, state.model))
  }

  const message = isRecord(parsed.message) ? parsed.message : null
  const deltaContent = typeof message?.content === 'string' ? message.content : ''
  appendDeltaChunks(state, chunks, messageId, deltaContent)

  if (parsed.done === true) {
    state.usage = {
      promptTokens: Number(parsed.prompt_eval_count ?? 0),
      completionTokens: Number(parsed.eval_count ?? 0),
      totalTokens: Number(parsed.prompt_eval_count ?? 0) + Number(parsed.eval_count ?? 0),
    }
    appendRunFinishedChunk(
      state,
      chunks,
      runId,
      typeof parsed.done_reason === 'string' ? parsed.done_reason : 'stop',
    )
  }

  return chunks
}

async function* createOllamaAgUiStream(
  ollamaStream: ReadableStream<Uint8Array>,
  initialModel: string,
): AsyncGenerator<AGUIEvent, void, void> {
  const runId = crypto.randomUUID()
  const messageId = crypto.randomUUID()
  const decoder = new TextDecoder()
  const reader = ollamaStream.getReader()

  let buffer = ''
  const state: StreamState = {
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
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      while (buffer.includes('\n')) {
        const separatorIndex = buffer.indexOf('\n')
        const line = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 1)

        const chunks = processOllamaJsonLine(state, runId, messageId, line)
        for (const chunk of chunks) {
          yield chunk as unknown as AGUIEvent
        }
      }
    }

    buffer += decoder.decode()
    if (buffer.trim().length > 0) {
      const tailChunks = processOllamaJsonLine(state, runId, messageId, buffer)
      for (const chunk of tailChunks) {
        yield chunk as unknown as AGUIEvent
      }
    }

    if (!state.emittedRunFinished && state.emittedRunStarted) {
      yield buildRunFinishedChunk(runId, state.model, state.finishReason, state.usage) as AGUIEvent
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Ollama stream error'
    yield {
      type: 'RUN_ERROR',
      runId,
      model: state.model,
      timestamp: Date.now(),
      error: { message },
    } as AGUIEvent
  } finally {
    reader.releaseLock()
  }
}

export function buildChatModelOptions(options: {
  providerId: AiProviderId
  params: ChatRequestParams | undefined
  config: AiConfigFormData
}): ExtendedModelOptions {
  const { config, params, providerId } = options
  const maxTokens = params?.maxTokens ?? config.parameters.max_tokens

  const modelOptions: ExtendedModelOptions = {
    temperature: params?.temperature ?? config.parameters.temperature,
    top_p: params?.topP ?? config.parameters.top_p,
    frequency_penalty: config.parameters.frequency_penalty,
    presence_penalty: config.parameters.presence_penalty,
  }

  if (providerId === 'openai') {
    modelOptions.max_output_tokens = maxTokens
  } else {
    modelOptions.max_tokens = maxTokens
  }

  if (providerId === 'anthropic') {
    modelOptions.thinking = {
      type: 'enabled',
      budget_tokens: Math.floor((modelOptions.max_tokens ?? 2048) / 2),
    }
  }

  return modelOptions
}

export async function streamLmStudioChat(options: {
  config: AiConfigFormData
  params?: ChatRequestParams
  messages: ChatMessage[]
  resolvedModel: string
}): Promise<Response> {
  const { config, messages, params, resolvedModel } = options
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

  const providerSpecificOptions = buildProviderSpecificOptions(config.provider, resolvedModel)

  const response = await fetch(`${baseUrl}${chatEndpoint}`, {
    method: 'POST',
    headers: getProviderHeaders(config),
    body: JSON.stringify({
      model: resolvedModel,
      messages: payloadMessages,
      temperature: params?.temperature ?? config.parameters.temperature,
      max_tokens: params?.maxTokens ?? config.parameters.max_tokens,
      top_p: params?.topP ?? config.parameters.top_p,
      frequency_penalty: config.parameters.frequency_penalty,
      presence_penalty: config.parameters.presence_penalty,
      stream: true,
      ...providerSpecificOptions,
    }),
  })

  if (!response.ok || !response.body) {
    const errorText = await response.text()
    return new Response(JSON.stringify({ error: errorText || 'LMSTUDIO_CHAT_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stream = createLmStudioAgUiStream(response.body, resolvedModel)
  return toServerSentEventsResponse(stream)
}

export async function streamOllamaChat(options: {
  config: AiConfigFormData
  params?: ChatRequestParams
  messages: ChatMessage[]
  resolvedModel: string
}): Promise<Response> {
  const { config, messages, params, resolvedModel } = options
  const serviceRootUrl = toServiceRootUrl(config.baseUrl)
  const payloadMessages = messages
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
    .filter((message) => message.content.length > 0)

  const response = await fetch(`${serviceRootUrl}/api/chat`, {
    method: 'POST',
    headers: getProviderHeaders(config),
    body: JSON.stringify({
      model: resolvedModel,
      messages: payloadMessages,
      think: false,
      stream: true,
      options: {
        temperature: params?.temperature ?? config.parameters.temperature,
        top_p: params?.topP ?? config.parameters.top_p,
        num_predict: params?.maxTokens ?? config.parameters.max_tokens,
        repeat_penalty: config.parameters.presence_penalty || 1,
      },
    }),
  })

  if (!response.ok || !response.body) {
    const errorText = await response.text()
    return new Response(JSON.stringify({ error: errorText || 'OLLAMA_CHAT_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stream = createOllamaAgUiStream(response.body, resolvedModel)
  return toServerSentEventsResponse(stream)
}
