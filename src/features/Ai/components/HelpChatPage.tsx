'use client'

import { fetchServerSentEvents, useChat, type UIMessage } from '@tanstack/ai-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Textarea } from '@/components/ui'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'
import { useTQuery } from '@/shared/lib/query'
import { cn } from '@/shared/utils/index'

type StoredMessage = {
  role: UIMessage['role']
  content: string
}

type ProviderStatus = {
  id: AiProviderId
  status: 'available' | 'auth_required' | 'unreachable' | 'error'
  available: boolean
  latencyMs: number
}

const storageKey = 'ai:help:messages'

const parseStoredMessages = (): StoredMessage[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredMessage[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((message) => message?.role && typeof message.content === 'string')
  } catch {
    return []
  }
}

const formatContent = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map((item) => formatContent(item)).join('\n')
  if (content && typeof content === 'object') {
    const record = content as Record<string, unknown>
    if (typeof record.text === 'string') return record.text
    if (typeof record.content === 'string') return record.content
  }
  return JSON.stringify(content)
}

const formatMessage = (message: UIMessage): string => {
  if (!Array.isArray(message.parts)) return ''
  return message.parts.map((part) => formatContent(part)).join('\n')
}

const toUiMessage = (message: StoredMessage, index: number): UIMessage => ({
  id: `stored-${index}`,
  role: message.role,
  parts: [{ type: 'text', content: message.content }],
})

export function HelpChatPage() {
  const { t } = useTranslation()
  const [input, setInput] = React.useState('')
  const [isOnline, setIsOnline] = React.useState(true)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const updateStatus = () => setIsOnline(window.navigator.onLine)
    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  const initialMessages = React.useMemo(
    () => parseStoredMessages().map((message, index) => toUiMessage(message, index)),
    [],
  )

  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents('/api/ai/chat'),
    initialMessages,
  })

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const serialized = JSON.stringify(
      messages.map((message) => ({
        role: message.role,
        content: formatMessage(message),
      })),
    )
    window.localStorage.setItem(storageKey, serialized)
  }, [messages])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  const providerQuery = useTQuery(
    ['ai', 'status'],
    async () => {
      const res = await fetch('/api/ai/status')
      if (!res.ok) {
        throw new Error('STATUS_FAILED')
      }
      return (await res.json()) as { statuses: ProviderStatus[] }
    },
    { cache: 'realtime', refetchInterval: 20000 },
  )

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading || !isOnline) return
    setInput('')
    sendMessage(trimmed)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-hidden">
      <div className="shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">{t('ai.chat.title')}</h2>
        <p className="text-muted-foreground">{t('ai.chat.description')}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">{t('ai.chat.providers')}</span>
        {(providerQuery.data?.statuses ?? []).map((status) => (
          <Badge
            key={status.id}
            variant={
              status.status === 'available'
                ? 'success'
                : status.status === 'auth_required'
                  ? 'warning'
                  : 'destructive'
            }
          >
            {status.id.toUpperCase()}
          </Badge>
        ))}
      </div>
      <div className="flex flex-1 flex-col min-h-0 rounded-xl border bg-card overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('ai.chat.empty')}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {formatMessage(message)}
                </div>
              ))}
              {isLoading && (
                <div className="max-w-[60%] rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                  {t('ai.chat.typing')}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        <div className="shrink-0 border-t p-4">
          <div className="flex flex-col gap-3">
            <Textarea
              className="min-h-[80px]"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('ai.chat.placeholder')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {!isOnline ? t('ai.chat.offline') : null}
              </div>
              <Button type="button" onClick={handleSend} disabled={!isOnline || isLoading}>
                {t('ai.chat.send')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
