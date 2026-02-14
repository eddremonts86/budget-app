'use client'

import { fetchServerSentEvents, useChat, type UIMessage } from '@tanstack/ai-react'
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  FileText,
  X,
  StopCircle,
  Trash2,
  Paperclip,
  Maximize2,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button, Textarea } from '@/components/ui'
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
  return message.parts
    .map((part) => {
      if (part.type === 'thinking') return `> Thinking: ${part.content}`
      return formatContent(part)
    })
    .join('\n')
}

const toUiMessage = (message: StoredMessage, index: number): UIMessage => ({
  id: `stored-${index}`,
  role: message.role,
  parts: [{ type: 'text', content: message.content }],
})

function MessagePart({ part }: { part: UIMessage['parts'][number] }) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = React.useState(false)

  if (part.type === 'thinking') {
    return (
      <div className="flex flex-col gap-2 overflow-hidden rounded-lg border border-primary/10 bg-muted/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs transition-transform duration-500',
                !isExpanded && 'animate-pulse',
              )}
            >
              💭
            </span>
            <span>{t('ai.chat.thinking')}</span>
          </div>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-1 px-3 pb-3 text-xs italic text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">
            {part.content}
          </div>
        )}
      </div>
    )
  }

  if (part.type === 'text') {
    return <div className="whitespace-pre-wrap leading-relaxed">{part.content}</div>
  }

  return null
}

export function HelpChatPage() {
  const { t } = useTranslation()
  const [input, setInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = React.useState<string | null>(null)
  const [isOnline, setIsOnline] = React.useState(true)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      setAttachments((prev) => [...prev, ...droppedFiles])
    }
  }

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

  const { messages, sendMessage, isLoading, stop, clear, error } = useChat({
    connection: fetchServerSentEvents('/api/ai/chat'),
    initialMessages,
  })

  React.useEffect(() => {
    if (error) {
      toast.error(t('ai.chat.error'), {
        description: error instanceof Error ? error.message : t('ai.chat.connectionError'),
        action: {
          label: t('ai.chat.retry'),
          onClick: () => {
            const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
            if (lastUserMessage) {
              // @ts-expect-error - sendMessage supports string or payload
              sendMessage(lastUserMessage.content)
            }
          },
        },
      })
    }
  }, [error, t, sendMessage, messages])

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey)
    }
    clear()
  }

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

  const handleSend = async (overrideContent?: string) => {
    const trimmed = overrideContent || input.trim()
    if ((!trimmed && attachments.length === 0) || isLoading || !isOnline) return

    // Base message parts
    const parts: UIMessage['parts'] = []
    if (trimmed) {
      parts.push({ type: 'text', content: trimmed })
    }

    // Process attachments
    await Promise.all(
      attachments.map(async (file) => {
        // Handle images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })

          parts.push({
            type: 'image',
            // @ts-expect-error - image property is used by adapters
            image: dataUrl,
          })
        }
        // Handle text-based documents
        else if (
          file.type === 'text/plain' ||
          file.type === 'application/json' ||
          file.name.endsWith('.md')
        ) {
          const content = await file.text()
          parts.push({
            type: 'text',
            content: `[File: ${file.name}]\n\`\`\`\n${content}\n\`\`\``,
          })
        }
        // Other files (PDF, etc.)
        else {
          parts.push({
            type: 'text',
            content: `[File Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB) - Content not yet supported for direct analysis]`,
          })
        }
      }),
    )

    setInput('')
    setAttachments([])

    const payload =
      parts.length === 1 && parts[0].type === 'text'
        ? (parts[0] as { content: string }).content
        : { parts }

    // @ts-expect-error - sendMessage in TanStack AI supports parts array
    sendMessage(payload)
  }

  const handleStop = () => {
    stop()
  }

  const suggestions = [
    { label: '¿Cómo exporto mis datos?', icon: '📊' },
    { label: 'Analiza esta imagen', icon: '🖼️' },
    { label: 'Configura mi perfil', icon: '⚙️' },
    { label: 'Problemas de pago', icon: '💳' },
  ]

  const isAgentActive = providerQuery.data?.statuses[0]?.available ?? true

  return (
    <div className="flex flex-1 flex-col h-full bg-background/30 rounded-3xl border border-border/50 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* SaaS Header Asistente */}
      <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-background to-background flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <span className="text-xl font-bold tracking-tighter">AI</span>
            </div>
            <div
              className={cn(
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background',
                isAgentActive ? 'bg-green-500 animate-pulse' : 'bg-destructive',
              )}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight leading-tight">{t('ai.chat.title')}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
              <span
                className={cn(
                  'flex h-1.5 w-1.5 rounded-full',
                  isAgentActive ? 'bg-green-500' : 'bg-destructive',
                )}
              />
              {isAgentActive ? t('ai.chat.supportAssistant') : t('ai.chat.agentInactive')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              'hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider transition-all',
              isAgentActive
                ? 'bg-muted/50 border-border/50 text-muted-foreground'
                : 'bg-destructive/10 border-destructive/20 text-destructive',
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                isAgentActive ? 'bg-primary animate-pulse' : 'bg-destructive',
              )}
            />
            {providerQuery.data?.statuses[0]?.id.toUpperCase() || 'SYSTEM'}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={handleClear}
            disabled={messages.length === 0 || isLoading}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      {/* Inactive Agent Warning Banner */}
      {!isAgentActive && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-2 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <AlertCircle size={16} className="text-destructive" />
          <span className="text-xs font-medium text-destructive">{t('ai.chat.agentInactive')}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 px-2 text-[10px] hover:bg-destructive/20 text-destructive disabled:opacity-50"
            onClick={async () => {
              const result = await providerQuery.refetch()
              if (result.data?.statuses[0]?.available) {
                toast.success(t('ai.chat.supportAssistant'), {
                  description: t('ai.chat.title'),
                })
              } else {
                toast.error(t('ai.chat.agentInactive'))
              }
            }}
            disabled={providerQuery.isRefetching}
          >
            <RefreshCcw
              size={12}
              className={cn('mr-1', providerQuery.isRefetching && 'animate-spin')}
            />
            {t('ai.chat.retry')}
          </Button>
        </div>
      )}

      {/* Multimedia Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <button
            onClick={() => setIsPreviewOpen(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
          >
            <X size={28} />
          </button>
          <img
            src={isPreviewOpen}
            alt="Preview"
            className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl border border-white/10 object-contain"
          />
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-sm mx-auto text-center gap-6 opacity-40 grayscale">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
              <ImageIcon size={40} className="text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl">{t('ai.chat.empty')}</h3>
              <p className="text-sm leading-relaxed">{t('ai.chat.emptyDescription')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.label)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-background/50 border border-border/50 text-left text-sm hover:bg-background hover:border-primary/50 hover:shadow-lg transition-all active:scale-95 group"
                >
                  <span className="text-xl group-hover:scale-125 transition-transform">
                    {s.icon}
                  </span>
                  <span className="font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col gap-3 max-w-[90%]',
                  message.role === 'user' ? 'ml-auto items-end' : 'items-start',
                )}
              >
                {/* Avatar/Label for Assistant */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                      AI
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      {t('ai.chat.assistantName')}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-2 w-full">
                  {message.parts.map((part, idx) => {
                    if (part.type === 'thinking') {
                      return (
                        <div key={`${message.id}-thinking-${idx}`} className="w-full max-w-2xl">
                          <MessagePart part={part} />
                        </div>
                      )
                    }
                    if (part.type === 'text') {
                      return (
                        <div
                          key={`${message.id}-text-${idx}`}
                          className={cn(
                            'relative rounded-2xl px-5 py-4 text-sm leading-relaxed transition-all duration-300 shadow-sm',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-none shadow-primary/20 font-medium'
                              : 'bg-background border border-border/50 text-foreground rounded-tl-none hover:shadow-md',
                          )}
                        >
                          <MessagePart part={part} />
                        </div>
                      )
                    }
                    if (part.type === 'image') {
                      return (
                        <div
                          key={`${message.id}-image-${idx}`}
                          className={cn(
                            'relative group rounded-2xl overflow-hidden border border-border/50 shadow-sm cursor-zoom-in transition-all hover:scale-[1.02] active:scale-95',
                            message.role === 'user' ? 'ml-auto' : 'mr-auto',
                          )}
                          onClick={() => {
                            const imagePart = part as unknown as { image: string }
                            setIsPreviewOpen(imagePart.image)
                          }}
                        >
                          <img
                            src={(part as unknown as { image: string }).image}
                            alt="Uploaded content"
                            className="max-w-[280px] md:max-w-[400px] h-auto object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 size={24} className="text-white" />
                          </div>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col gap-4 items-start animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                    AI
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    {t('ai.chat.typing')}
                  </span>
                </div>
                <div className="rounded-2xl bg-muted/30 border border-border/50 px-6 py-4 shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-primary/40"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-primary/80"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
                      {t('ai.chat.typing')}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                  className="h-9 rounded-xl gap-2 text-[10px] font-bold uppercase tracking-widest bg-background/50 border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-destructive/20"
                >
                  <StopCircle size={16} />
                  {t('common.stop')}
                </Button>
              </div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area SaaS Style */}
      <div
        className={cn(
          'p-6 border-t border-border/50 bg-background/50 backdrop-blur-md transition-all duration-500',
          attachments.length > 0 && 'bg-primary/5',
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* File Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6 animate-in slide-in-from-bottom-4 duration-500">
            {attachments.map((file, i) => (
              <div
                key={i}
                className="group relative flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/50 shadow-sm pr-10 transition-all hover:border-primary/50"
              >
                {file.type.startsWith('image/') ? (
                  <div
                    className="w-12 h-12 rounded-xl overflow-hidden bg-muted cursor-zoom-in ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all"
                    onClick={() => {
                      const url = URL.createObjectURL(file)
                      setIsPreviewOpen(url)
                    }}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-all">
                    <FileText size={24} />
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold max-w-[120px] truncate">{file.name}</span>
                  <span className="text-[10px] font-medium opacity-50 uppercase tracking-tighter">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-4 bg-muted/40 p-3 rounded-[2rem] border border-border/50 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/30 focus-within:bg-background transition-all duration-300">
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={onFileChange}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={24} />
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (isAgentActive) handleSend()
              }
            }}
            placeholder={
              !isOnline
                ? t('ai.chat.offline')
                : !isAgentActive
                  ? t('ai.chat.agentInactive')
                  : t('ai.chat.placeholder')
            }
            disabled={isLoading || !isOnline || !isAgentActive}
            className="flex-1 min-h-[48px] max-h-[200px] bg-transparent border-none focus-visible:ring-0 resize-none py-3 px-4 text-base leading-relaxed placeholder:text-muted-foreground/50 self-center rounded-2xl"
          />

          <Button
            onClick={() => handleSend()}
            disabled={
              (!input.trim() && attachments.length === 0) ||
              isLoading ||
              !isOnline ||
              !isAgentActive
            }
            className="h-12 px-8 rounded-full font-bold tracking-tight shadow-lg shadow-primary/20 transition-all active:scale-95 shrink-0 bg-primary hover:shadow-xl hover:shadow-primary/30"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-3 border-background border-t-transparent" />
            ) : (
              <div className="flex items-center gap-2">
                <span>{t('common.send')}</span>
                <ChevronUp size={18} />
              </div>
            )}
          </Button>
        </div>

        <div className="mt-4 px-6 flex justify-between items-center text-[10px] text-muted-foreground/40 uppercase tracking-widest font-black">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              {t('ai.chat.dropFiles')}
            </span>
          </div>
          <span>{t('ai.chat.pressEnter')}</span>
        </div>
      </div>
    </div>
  )
}
