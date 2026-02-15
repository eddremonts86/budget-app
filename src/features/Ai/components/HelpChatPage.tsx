'use client'

import { useUser } from '@clerk/tanstack-react-start'
import { fetchServerSentEvents, useChat, type UIMessage } from '@tanstack/ai-react'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Paperclip,
  Sparkles,
  StopCircle,
  Trash2,
  User,
  X,
  Settings,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Button, Textarea } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'
import { useTQuery } from '@/shared/lib/query'
import { cn } from '@/shared/utils/index'

// --- Types ---

type StoredMessage = {
  role: UIMessage['role']
  content: string
  parts?: UIMessage['parts']
}

type ProviderStatus = {
  id: AiProviderId
  status: 'available' | 'auth_required' | 'unreachable' | 'error'
  available: boolean
  latencyMs: number
}

const storageKey = 'ai:help:messages'

// --- Helpers ---

const parseStoredMessages = (): StoredMessage[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredMessage[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((message) => message?.role)
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
  parts: message.parts || [{ type: 'text', content: message.content }],
})

// --- Components ---

function ThinkingProcess({ content }: { content: string }) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm transition-all duration-300 hover:bg-indigo-500/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-500">
            <Sparkles size={12} />
          </div>
          <span className="text-xs font-semibold text-indigo-600/80 dark:text-indigo-300">
            {t('ai.chat.thinking')}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-indigo-500/10 bg-black/5 px-4 py-3 text-xs text-muted-foreground/90 font-mono whitespace-pre-wrap leading-relaxed dark:bg-white/5">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MessageBubble({
  message,
  onImageClick,
  userAvatar,
  isTyping,
}: {
  message: UIMessage
  onImageClick: (url: string) => void
  userAvatar?: string | null
  isTyping?: boolean
}) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('group flex w-full gap-4', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 ring-2 ring-background">
          <Bot size={20} className="text-white" />
        </div>
      )}

      <div className={cn('flex max-w-[85%] flex-col gap-1', isUser && 'items-end')}>
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-[10px] text-muted-foreground/40">•</span>
          <span className="text-[10px] text-muted-foreground/40">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div
          className={cn(
            'relative overflow-hidden px-5 py-4 text-sm shadow-sm transition-all duration-300',
            isUser
              ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-indigo-500/10'
              : 'rounded-2xl rounded-tl-sm bg-card/80 border border-border/50 text-foreground backdrop-blur-md hover:bg-card/90 hover:shadow-md',
          )}
        >
          {message.parts.map((part, idx) => {
            if (part.type === 'thinking') {
              return <ThinkingProcess key={idx} content={part.content} />
            }
            if (part.type === 'text') {
              return (
                <div key={idx} className={cn("markdown-content leading-7", isUser ? "text-white/90" : "text-foreground/90")}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ref: _ref, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !String(className).includes('inline') && match ? (
                          <div className="my-4 overflow-hidden rounded-lg border border-border/50 bg-zinc-950 shadow-sm">
                            <div className="flex items-center justify-between bg-zinc-900/50 px-3 py-1.5 border-b border-border/10">
                                <span className="text-[10px] font-mono text-zinc-400">{match[1]}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded hover:bg-white/10 text-zinc-400"
                                  onClick={() => navigator.clipboard.writeText(String(children))}
                                >
                                  <Copy size={12} />
                                </Button>
                            </div>
                            <SyntaxHighlighter
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              style={vscDarkPlus as any}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={cn("rounded px-1.5 py-0.5 font-mono text-xs font-medium", isUser ? "bg-white/20 text-white" : "bg-muted text-foreground")} {...props}>
                            {children}
                          </code>
                        )
                      },
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="pl-1">{children}</li>,
                      a: ({ children, href }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-indigo-500/50 underline-offset-2 hover:decoration-indigo-500 transition-colors font-medium">
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-indigo-500/30 pl-4 py-1 my-2 italic text-muted-foreground bg-indigo-500/5 rounded-r">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                         <div className="my-4 w-full overflow-y-auto rounded-lg border border-border/50">
                            <table className="w-full text-sm">{children}</table>
                         </div>
                      ),
                      th: ({ children }) => <th className="border-b border-border/50 bg-muted/30 px-4 py-2 text-left font-bold">{children}</th>,
                      td: ({ children }) => <td className="border-b border-border/10 px-4 py-2">{children}</td>,
                    }}
                  >
                    {part.content}
                  </ReactMarkdown>
                </div>
              )
            }
            if (part.type === 'image') {
              const imgUrl = (part as unknown as { image: string }).image
              return (
                <div
                  key={idx}
                  className="mt-3 overflow-hidden rounded-xl border border-border/20 bg-black/5 shadow-sm"
                >
                  <img
                    src={imgUrl}
                    alt="Uploaded content"
                    className="max-h-[300px] w-full cursor-zoom-in object-cover transition-transform duration-300 hover:scale-105"
                    onClick={() => onImageClick(imgUrl)}
                  />
                </div>
              )
            }
            return null
          })}
          {isTyping && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500/60 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500/60 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500/60" />
            </div>
          )}

          {!isUser && (
            <div className="absolute bottom-2 right-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background hover:text-indigo-600"
                onClick={() => handleCopy(formatMessage(message))}
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          {userAvatar ? (
            <Avatar className="h-10 w-10 rounded-full border-2 border-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-100 dark:border-zinc-800 dark:ring-indigo-900">
              <AvatarImage src={userAvatar} alt="User" />
              <AvatarFallback>
                <User size={20} className="text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 ring-2 ring-white dark:from-zinc-800 dark:to-zinc-900 dark:ring-zinc-800">
              <User size={20} className="text-zinc-500" />
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  const { t } = useTranslation()
  const suggestions = [
    { label: 'Create a new project plan', icon: '🚀', desc: 'Step-by-step guide' },
    { label: 'Analyze this code snippet', icon: '💻', desc: 'Debug & optimize' },
    { label: 'Write an email draft', icon: '✉️', desc: 'Professional tone' },
    { label: 'Explain a complex concept', icon: '🧠', desc: 'Simple terms' },
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="mb-8 relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-indigo-500/20 blur-xl"></div>
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 ring-4 ring-white/10">
          <Sparkles size={48} className="text-white" />
        </div>
      </div>
      
      <h3 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {t('ai.chat.empty')}
      </h3>
      <p className="mb-10 max-w-md text-base text-muted-foreground leading-relaxed">
        {t('ai.chat.emptyDescription')}
      </p>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(s.label)}
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-4 text-left shadow-sm transition-all duration-300 hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:shadow-indigo-500/10 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
                <span className="text-2xl">{s.icon}</span>
                <div>
                    <span className="block font-semibold text-foreground group-hover:text-indigo-600 transition-colors">
                    {s.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.desc}</span>
                </div>
            </div>
            <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowUp size={16} className="text-indigo-500 rotate-45" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Main Page Component ---

export function HelpChatPage() {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()
  const [input, setInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = React.useState<string | null>(null)
  const [isOnline, setIsOnline] = React.useState(true)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

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
    connection: fetchServerSentEvents(`/api/ai/chat?locale=${i18n.language}`),
    initialMessages,
  })

  // Error toast
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
        parts: message.parts,
      })),
    )
    window.localStorage.setItem(storageKey, serialized)
  }, [messages])

  // Auto-scroll
  React.useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const providerQuery = useTQuery(
    ['ai', 'status'],
    async () => {
      const res = await fetch('/api/ai/status')
      if (!res.ok) throw new Error('STATUS_FAILED')
      return (await res.json()) as { statuses: ProviderStatus[] }
    },
    { cache: 'realtime', refetchInterval: 20000 },
  )

  const handleSend = async (overrideContent?: string) => {
    const trimmed = overrideContent || input.trim()
    if ((!trimmed && attachments.length === 0) || isLoading || !isOnline) return

    const parts: UIMessage['parts'] = []
    if (trimmed) parts.push({ type: 'text', content: trimmed })

    await Promise.all(
      attachments.map(async (file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parts.push({ type: 'image', image: dataUrl } as any)
        } else {
          const content = await file.text().catch(() => 'Error reading file')
          parts.push({
            type: 'text',
            content: `[File: ${file.name}]\n\`\`\`\n${content}\n\`\`\``,
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

    // @ts-expect-error - sendMessage supports parts
    sendMessage(payload)
  }

  const isAgentActive = providerQuery.data?.statuses[0]?.available ?? true

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-background/50 shadow-2xl backdrop-blur-2xl dark:border-white/5 dark:bg-black/40">
      
      {/* --- Dynamic Background --- */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200/20 via-background/0 to-background/0 dark:from-indigo-900/20"></div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-200/20 via-background/0 to-background/0 dark:from-purple-900/20"></div>

      {/* --- Header --- */}
      <header className="flex h-20 items-center justify-between border-b border-white/10 bg-white/40 px-8 backdrop-blur-md dark:bg-black/20">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
            <Bot size={24} />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                  isAgentActive ? 'bg-green-400' : 'bg-red-400',
                )}
              ></span>
              <span
                className={cn(
                  'relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white dark:border-black',
                  isAgentActive ? 'bg-green-500' : 'bg-red-500',
                )}
              ></span>
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground">{t('ai.chat.title')}</h2>
            <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full", isAgentActive ? "bg-green-500" : "bg-red-500")}></span>
                <p className="text-xs font-medium text-muted-foreground">
                {isAgentActive ? t('ai.chat.supportAssistant') : t('ai.chat.agentInactive')}
                </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              'hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest md:flex shadow-sm',
              isAgentActive
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-300'
                : 'border-destructive/20 bg-destructive/10 text-destructive',
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
            {providerQuery.data?.statuses[0]?.id.toUpperCase() || 'SYSTEM'}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={handleClear}
            disabled={messages.length === 0 || isLoading}
            title="Clear Chat"
          >
            <Trash2 size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-muted"
            title="Settings"
            onClick={() => navigate({ to: '/dashboard/settings', search: { ia_config: true } })}
          >
            <Settings size={18} />
          </Button>
        </div>
      </header>

      {/* --- Messages --- */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth p-6 md:p-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-indigo-500/10 hover:scrollbar-thumb-indigo-500/20"
      >
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={handleSend} />
        ) : (
          <div className="flex flex-col gap-8 mx-auto max-w-4xl">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                onImageClick={setIsPreviewOpen}
                userAvatar={user?.imageUrl}
                isTyping={
                  isLoading && index === messages.length - 1 && message.role === 'assistant'
                }
              />
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 ring-2 ring-background">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/40 bg-card/50 px-5 py-4 shadow-sm backdrop-blur-sm">
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-indigo-500/60"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-indigo-500/60"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-indigo-500/60"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* --- Input Area --- */}
      <div
        className="relative z-10 border-t border-white/10 bg-white/40 p-6 backdrop-blur-xl dark:bg-black/40"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="mx-auto max-w-4xl">
            {/* Attachments Preview */}
            <AnimatePresence>
                {attachments.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-4 flex gap-3 overflow-x-auto pb-2"
                >
                    {attachments.map((file, i) => (
                    <div
                        key={i}
                        className="group relative flex w-36 shrink-0 flex-col gap-2 rounded-xl border border-white/20 bg-white/50 p-2.5 shadow-sm backdrop-blur-md dark:bg-black/50"
                    >
                        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-muted/50 overflow-hidden">
                        {file.type.startsWith('image/') ? (
                            <img
                            src={URL.createObjectURL(file)}
                            alt=""
                            className="h-full w-full object-cover"
                            />
                        ) : (
                            <FileText size={24} className="text-indigo-500" />
                        )}
                        </div>
                        <span className="truncate text-[10px] font-semibold text-muted-foreground px-1">
                        {file.name}
                        </span>
                        <button
                        onClick={() => removeAttachment(i)}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-md opacity-0 transition-all group-hover:opacity-100 hover:scale-110"
                        >
                        <X size={12} />
                        </button>
                    </div>
                    ))}
                </motion.div>
                )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="relative flex items-end gap-3 rounded-[2rem] border border-white/20 bg-white/60 p-2 shadow-xl shadow-indigo-500/5 transition-all focus-within:border-indigo-500/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 dark:bg-black/40 dark:focus-within:bg-black/60">
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
                className="h-11 w-11 shrink-0 rounded-full text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
            >
                <Paperclip size={20} />
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
                className="min-h-[48px] max-h-[160px] w-full resize-none border-0 bg-transparent py-3.5 text-base focus-visible:ring-0 placeholder:text-muted-foreground/50"
            />

            {isLoading ? (
                <Button
                variant="destructive"
                size="icon"
                onClick={() => stop()}
                className="h-11 w-11 shrink-0 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                <StopCircle size={20} />
                </Button>
            ) : (
                <Button
                onClick={() => handleSend()}
                disabled={(!input.trim() && attachments.length === 0) || !isOnline || !isAgentActive}
                className={cn(
                    'h-11 w-11 shrink-0 rounded-full shadow-lg transition-all duration-300',
                    input.trim() || attachments.length > 0
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-indigo-500/25 hover:scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
                size="icon"
                >
                <ArrowUp size={20} />
                </Button>
            )}
            </div>
            <div className="mt-3 flex justify-center items-center gap-2 text-[10px] font-medium text-muted-foreground/60">
                <Sparkles size={10} />
                <span>AI can make mistakes. Verify important information.</span>
            </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
            onClick={() => setIsPreviewOpen(null)}
          >
            <button
              className="absolute right-6 top-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              onClick={() => setIsPreviewOpen(null)}
            >
              <X size={28} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={isPreviewOpen}
              alt="Preview"
              className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
