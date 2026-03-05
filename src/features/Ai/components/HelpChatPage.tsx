'use client'

import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { aiConfigApi } from '@/features/Settings/api/ai-config.api'
import { useAiConfigStore } from '@/features/Settings/api/ai-config.queries'
import { useCurrentUser } from '@/features/Users/hooks/useCurrentUser'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'
import { useTQuery } from '@/shared/lib/query'
import type {
  Conversation,
  PersistedActionState,
  StoredMessage,
} from '@/shared/lib/storage/chat-storage'
import {
  createConversationObject,
  deleteAllConversations,
  deleteConversation,
  generateTitle,
  getConversation,
  getConversations,
  migrateFromLocalStorage,
  saveConversation,
} from '@/shared/lib/storage/chat-storage'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/utils/index'
import { useUser } from '@clerk/tanstack-react-start'
import { fetchServerSentEvents, useChat, type UIMessage } from '@tanstack/ai-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Paperclip,
  Settings,
  Sparkles,
  StopCircle,
  Trash2,
  User,
  X,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus.js'
import remarkGfm from 'remark-gfm'
import { ActionConfirmationCard } from './ActionConfirmationCard'
import { ActionStatesProvider } from './ActionStatesContext'
import { ConversationPanel } from './ConversationPanel'

// --- Types ---

type ProviderStatus = {
  id: AiProviderId
  status: 'available' | 'auth_required' | 'unreachable' | 'error'
  available: boolean
  latencyMs: number
}

// --- Helpers ---

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts: (Array.isArray(message.parts)
    ? message.parts
    : [{ type: 'text', content: message.content }]) as any,
})

function messagesToStored(messages: UIMessage[]): StoredMessage[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: formatMessage(msg),
    parts: msg.parts as StoredMessage['parts'],
  }))
}

// --- Conversation Manager Hook ---

function useConversationManager(userId: string | null, userRole: 'admin' | 'user' = 'user') {
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [activeConv, setActiveConv] = React.useState<Conversation | null>(null)
  const [isReady, setIsReady] = React.useState(false)

  // Keep activeConv in a ref so callbacks always see the latest value
  const activeConvRef = React.useRef(activeConv)
  React.useEffect(() => {
    activeConvRef.current = activeConv
  }, [activeConv])

  const activeIdRef = React.useRef(activeId)
  React.useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  // Initialise: migrate from localStorage + load conversations
  React.useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const migratedId = userId ? await migrateFromLocalStorage(userId) : null
      // Admins fetch all, users fetch theirs
      const convs = await getConversations(userRole === 'admin' ? undefined : (userId ?? ''))
      if (cancelled) return
      setConversations(convs)
      if (migratedId) {
        setActiveId(migratedId)
      } else if (convs.length > 0) {
        setActiveId(convs[0].id)
      }
      setIsReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [userId, userRole])

  // Load the active conversation object when activeId changes
  React.useEffect(() => {
    if (!activeId) {
      setActiveConv(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const conv = await getConversation(activeId)
      if (cancelled) return
      setActiveConv(conv ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [activeId])

  const createNew = React.useCallback(async () => {
    if (!userId) return null
    const conv = createConversationObject(userId)
    await saveConversation(conv)
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
    return conv
  }, [userId])

  const select = React.useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const remove = React.useCallback(async (id: string) => {
    await deleteConversation(id)
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id)
      // If we deleted the active conversation, switch to the next one
      if (activeIdRef.current === id) {
        setActiveId(remaining.length > 0 ? remaining[0].id : null)
      }
      return remaining
    })
  }, [])

  const removeAll = React.useCallback(async () => {
    if (!userId) return
    await deleteAllConversations(userId)
    setConversations([])
    setActiveId(null)
  }, [userId])

  const saveMessages = React.useCallback(async (msgs: StoredMessage[]) => {
    const conv = activeConvRef.current
    if (!conv) return
    const updated: Conversation = {
      ...conv,
      messages: msgs,
      updatedAt: Date.now(),
    }
    if (!updated.title && msgs.length > 0) {
      updated.title = generateTitle(msgs)
    }
    await saveConversation(updated)
    setActiveConv(updated)
    setConversations((prev) =>
      prev
        .map((c) => (c.id === updated.id ? updated : c))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    )
  }, [])

  const saveActionState = React.useCallback(async (key: string, state: PersistedActionState) => {
    const conv = activeConvRef.current
    if (!conv) return
    const newStates = { ...conv.actionStates, [key]: state }
    const updated: Conversation = {
      ...conv,
      actionStates: newStates,
      updatedAt: Date.now(),
    }
    await saveConversation(updated)
    setActiveConv(updated)
  }, [])

  const clearActive = React.useCallback(async () => {
    const conv = activeConvRef.current
    if (!conv) return
    const updated: Conversation = {
      ...conv,
      messages: [],
      actionStates: {},
      title: '',
      updatedAt: Date.now(),
    }
    await saveConversation(updated)
    setActiveConv(updated)
    setConversations((prev) =>
      prev
        .map((c) => (c.id === updated.id ? updated : c))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    )
  }, [])

  return {
    conversations,
    activeId,
    activeConv,
    isReady,
    createNew,
    select,
    remove,
    removeAll,
    saveMessages,
    saveActionState,
    clearActive,
  }
}

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
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-indigo-500/10 bg-black/5 px-4 py-3 text-xs text-muted-foreground/90 font-mono whitespace-pre-wrap leading-relaxed dark:bg-white/5">
              {content}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Markdown component overrides (extracted to avoid re-creation on each render) ---

const MarkdownP = ({ children }: { children?: React.ReactNode }) => (
  <p className="mb-2 last:mb-0">{children}</p>
)
const MarkdownUl = ({ children }: { children?: React.ReactNode }) => (
  <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
)
const MarkdownOl = ({ children }: { children?: React.ReactNode }) => (
  <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
)
const MarkdownLi = ({ children }: { children?: React.ReactNode }) => (
  <li className="pl-1">{children}</li>
)
const MarkdownA = ({ children, href }: { children?: React.ReactNode; href?: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="underline decoration-indigo-500/50 underline-offset-2 hover:decoration-indigo-500 transition-colors font-medium"
  >
    {children}
  </a>
)
const MarkdownBlockquote = ({ children }: { children?: React.ReactNode }) => (
  <blockquote className="border-l-4 border-indigo-500/30 pl-4 py-1 my-2 italic text-muted-foreground bg-indigo-500/5 rounded-r">
    {children}
  </blockquote>
)
const MarkdownTable = ({ children }: { children?: React.ReactNode }) => (
  <div className="my-4 w-full overflow-y-auto rounded-lg border border-border/50">
    <table className="w-full text-sm">{children}</table>
  </div>
)
const MarkdownTh = ({ children }: { children?: React.ReactNode }) => (
  <th className="border-b border-border/50 bg-muted/30 px-4 py-2 text-left font-bold">
    {children}
  </th>
)
const MarkdownTd = ({ children }: { children?: React.ReactNode }) => (
  <td className="border-b border-border/10 px-4 py-2">{children}</td>
)

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
  const { t } = useTranslation()
  const isUser = message.role === 'user'
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('group flex w-full gap-4', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 ring-2 ring-background">
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
              ? 'rounded-2xl rounded-tr-sm bg-linear-to-br from-indigo-600 to-blue-600 text-white shadow-indigo-500/10'
              : 'rounded-2xl rounded-tl-sm bg-card/80 border border-border/50 text-foreground backdrop-blur-md hover:bg-card/90 hover:shadow-md',
          )}
        >
          {Array.isArray(message.parts)
            ? message.parts.map((part, partIndex) => {
                const partKey = `${message.id}-part-${partIndex}`
                if (part.type === 'thinking') {
                  return <ThinkingProcess key={partKey} content={part.content} />
                }
                if (part.type === 'text') {
                  // Show error placeholder for empty AI responses
                  if (!part.content?.trim()) {
                    if (!isUser) {
                      return (
                        <div
                          key={partKey}
                          className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
                        >
                          <span className="text-base">⚠️</span>
                          <span>{t('ai.chat.emptyResponse')}</span>
                        </div>
                      )
                    }
                    return null
                  }
                  return (
                    <div
                      key={partKey}
                      className={cn(
                        'markdown-content leading-7',
                        isUser ? 'text-white/90' : 'text-foreground/90',
                      )}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ref: _ref, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            // Render action confirmation card for action code blocks
                            if (match?.[1] === 'action') {
                              return (
                                <ActionConfirmationCard
                                  actionJson={String(children).replace(/\n$/, '')}
                                />
                              )
                            }
                            return !String(className).includes('inline') && match ? (
                              <div className="my-4 overflow-hidden rounded-lg border border-border/50 bg-zinc-950 shadow-sm">
                                <div className="flex items-center justify-between bg-zinc-900/50 px-3 py-1.5 border-b border-border/10">
                                  <span className="text-[10px] font-mono text-zinc-400">
                                    {match[1]}
                                  </span>
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
                                  customStyle={{
                                    margin: 0,
                                    padding: '1rem',
                                    background: 'transparent',
                                  }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code
                                className={cn(
                                  'rounded px-1.5 py-0.5 font-mono text-xs font-medium',
                                  isUser ? 'bg-white/20 text-white' : 'bg-muted text-foreground',
                                )}
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          },
                          p: MarkdownP,
                          ul: MarkdownUl,
                          ol: MarkdownOl,
                          li: MarkdownLi,
                          a: MarkdownA,
                          blockquote: MarkdownBlockquote,
                          table: MarkdownTable,
                          th: MarkdownTh,
                          td: MarkdownTd,
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
                      key={partKey}
                      className="mt-3 overflow-hidden rounded-xl border border-border/20 bg-black/5 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => onImageClick(imgUrl)}
                        className="block w-full"
                        title="Click to preview image"
                      >
                        <img
                          src={imgUrl}
                          alt="Uploaded content"
                          className="max-h-75 w-full cursor-zoom-in object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </button>
                    </div>
                  )
                }
                // @ts-expect-error - tool calls
                if (part.type === 'tool-invocation') {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const toolName = (part as any).toolCall?.toolName
                  return (
                    <div
                      key={partKey}
                      className="rounded-lg border border-border/50 bg-background/50 p-3 text-sm"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        Using tool: <span className="font-mono text-xs">{toolName}</span>
                      </div>
                    </div>
                  )
                }
                return null
              })
            : null}
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-zinc-100 to-zinc-200 ring-2 ring-white dark:from-zinc-800 dark:to-zinc-900 dark:ring-zinc-800">
              <User size={20} className="text-zinc-500" />
            </div>
          )}
        </div>
      )}
    </m.div>
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
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 ring-4 ring-white/10">
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
        {suggestions.map((s) => (
          <button
            key={s.label}
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
  const { userRole, syncedUserId } = useCurrentUser()
  const navigate = useNavigate()
  const [input, setInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = React.useState<string | null>(null)
  const [isOnline, setIsOnline] = React.useState(true)
  const [isPanelOpen, setIsPanelOpen] = React.useState(false)
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
    if (globalThis.window === undefined) return
    const updateStatus = () => setIsOnline(globalThis.window.navigator.onLine)
    updateStatus()
    globalThis.window.addEventListener('online', updateStatus)
    globalThis.window.addEventListener('offline', updateStatus)
    return () => {
      globalThis.window.removeEventListener('online', updateStatus)
      globalThis.window.removeEventListener('offline', updateStatus)
    }
  }, [])

  const userId = user?.id ?? null
  const convManager = useConversationManager(userId, userRole)

  // Compute initial messages from the active conversation (for first useChat mount)
  const initialMessages = React.useMemo(
    () => (convManager.activeConv?.messages ?? []).map((msg, i) => toUiMessage(msg, i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [convManager.activeId],
  )

  const { messages, sendMessage, isLoading, stop, clear, error, setMessages } = useChat({
    connection: fetchServerSentEvents(`/api/ai/chat/completions?locale=${i18n.language}`),
    initialMessages,
  })

  // When the active conversation changes (user switches), load its messages
  const loadedConvIdRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!convManager.isReady) return
    if (convManager.activeConv && convManager.activeId !== loadedConvIdRef.current) {
      loadedConvIdRef.current = convManager.activeId
      const uiMessages = convManager.activeConv.messages.map((msg, i) => toUiMessage(msg, i))
      setMessages(uiMessages)
    } else if (!convManager.activeId && loadedConvIdRef.current !== null) {
      loadedConvIdRef.current = null
      clear()
    }
  }, [convManager.activeConv, convManager.activeId, convManager.isReady, setMessages, clear])

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

  // Persist messages to IndexedDB when they change
  const prevMsgHashRef = React.useRef('')
  const isLoadingConvRef = React.useRef(false)
  React.useEffect(() => {
    if (!convManager.isReady || !convManager.activeId) return
    if (isLoadingConvRef.current) return
    if (messages.length === 0) return
    const stored = messagesToStored(messages)
    const hash = JSON.stringify(stored.map((m) => m.content))
    if (hash === prevMsgHashRef.current) return
    prevMsgHashRef.current = hash
    convManager.saveMessages(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, convManager.isReady, convManager.activeId, convManager.saveMessages])

  // Mark when we're loading a conversation (to skip persistence during load)
  React.useEffect(() => {
    isLoadingConvRef.current = true
    const id = requestAnimationFrame(() => {
      isLoadingConvRef.current = false
    })
    return () => cancelAnimationFrame(id)
  }, [convManager.activeId])

  // Filter out empty assistant messages (e.g. from error responses)
  const visibleMessages = React.useMemo(
    () =>
      messages.filter((msg) => {
        if (msg.role !== 'assistant') return true
        // Keep if any part has content
        return (
          Array.isArray(msg.parts) &&
          msg.parts.some((part) => {
            if (part.type === 'text') return !!part.content?.trim()
            if (part.type === 'thinking') return !!part.content?.trim()
            return true // keep other part types (images, etc.)
          })
        )
      }),
    [messages],
  )

  const handleClear = () => {
    clear()
    prevMsgHashRef.current = ''
    convManager.clearActive()
  }

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

  const { data: configStore } = useAiConfigStore()
  const queryClient = useQueryClient()

  const setActiveProviderMutation = useMutation({
    mutationFn: (provider: string) => aiConfigApi.setActiveProvider(provider as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] })
      queryClient.invalidateQueries({ queryKey: ['ai', 'status'] })
      toast.success(t('settings.ai.messages.saved') || 'Provider updated')
    },
    onError: (error) => {
      toast.error(t('settings.ai.messages.error') || 'Failed to update provider', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const handleProviderChange = (value: string) => {
    setActiveProviderMutation.mutate(value)
  }

  const handleSend = async (overrideContent?: string) => {
    const trimmed = overrideContent || input.trim()
    if ((!trimmed && attachments.length === 0) || isLoading || !isOnline) return

    // Auto-create a conversation if none is active
    if (!convManager.activeId) {
      await convManager.createNew()
    }

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

    // When files are attached without user text, add an automatic instruction
    if (!trimmed && attachments.length > 0) {
      const hasTextFiles = attachments.some((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
        return ['txt', 'md', 'csv', 'json', 'yaml', 'yml', 'xml', 'log'].includes(ext)
      })
      const instruction = hasTextFiles
        ? t('ai.chat.fileAutoInstruction')
        : t('ai.chat.fileAnalyzeInstruction')
      parts.unshift({ type: 'text', content: instruction })
    }

    setInput('')
    setAttachments([])

    const payload =
      parts.length === 1 && parts[0].type === 'text'
        ? (parts[0] as { content: string }).content
        : { content: parts }

    // @ts-expect-error - sendMessage supports multimodal content objects
    sendMessage(payload)
  }

  const handleNewConversation = async () => {
    const newConv = await convManager.createNew()
    if (newConv) {
      // Pre-set the ref so the load effect won't re-trigger for this conversation
      loadedConvIdRef.current = newConv.id
    }
    setMessages([])
    prevMsgHashRef.current = ''
    setIsPanelOpen(false)
  }

  const handleSelectConversation = (id: string) => {
    prevMsgHashRef.current = ''
    convManager.select(id)
    setIsPanelOpen(false)
  }

  const handleDeleteConversation = async (id: string) => {
    await convManager.remove(id)
  }

  const handleDeleteAll = async () => {
    await convManager.removeAll()
    clear()
    prevMsgHashRef.current = ''
  }

  const isAgentActive = React.useMemo(() => {
    if (!providerQuery.data?.statuses) return true
    const activeId = configStore?.activeProvider
    if (!activeId) return providerQuery.data.statuses[0]?.available ?? true
    const status = providerQuery.data.statuses.find((s) => s.id === activeId)
    return status?.available ?? true
  }, [providerQuery.data, configStore?.activeProvider])

  return (
    <ActionStatesProvider
      states={convManager.activeConv?.actionStates ?? {}}
      onSaveState={convManager.saveActionState}
    >
      <LazyMotion features={domAnimation}>
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-background/50 shadow-2xl backdrop-blur-2xl dark:border-white/5 dark:bg-black/40">
          {/* --- Dynamic Background --- */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-200/20 via-background/0 to-background/0 dark:from-indigo-900/20"></div>
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,var(--tw-gradient-stops))] from-purple-200/20 via-background/0 to-background/0 dark:from-purple-900/20"></div>

          {/* --- Conversation Panel --- */}
          <ConversationPanel
            conversations={convManager.conversations}
            activeId={convManager.activeId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
            onDeleteAll={handleDeleteAll}
            isOpen={isPanelOpen}
            onToggle={() => setIsPanelOpen(!isPanelOpen)}
            userRole={userRole}
            currentUserId={syncedUserId}
          />

          {/* --- Header --- */}
          <header className="flex h-20 items-center justify-between border-b border-white/10 bg-white/40 px-8 backdrop-blur-md dark:bg-black/20">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
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
                <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                  {t('ai.chat.title')}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isAgentActive ? 'bg-green-500' : 'bg-red-500',
                    )}
                  ></span>
                  <p className="text-xs font-medium text-muted-foreground">
                    {isAgentActive ? t('ai.chat.supportAssistant') : t('ai.chat.agentInactive')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground/60 font-medium">
                  <Sparkles size={10} />
                  <span>AI can make mistakes. Verify important information.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex">
                <Select
                  value={configStore?.activeProvider}
                  onValueChange={handleProviderChange}
                  disabled={isLoading || setActiveProviderMutation.isPending}
                >
                  <SelectTrigger
                    className={cn(
                      'h-8 gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors',
                      isAgentActive
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40'
                        : 'border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      <SelectValue placeholder="SYSTEM" />
                    </div>
                  </SelectTrigger>
                  <SelectContent align="end">
                    {Object.keys(configStore?.providers || {}).map((provider) => (
                      <SelectItem
                        key={provider}
                        value={provider}
                        className="text-xs font-medium uppercase"
                      >
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            {visibleMessages.length === 0 && !error ? (
              <EmptyState onSuggestionClick={handleSend} />
            ) : (
              <div className="flex flex-col gap-8 mx-auto max-w-4xl">
                {visibleMessages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onImageClick={setIsPreviewOpen}
                    userAvatar={user?.imageUrl}
                    isTyping={
                      isLoading &&
                      index === visibleMessages.length - 1 &&
                      message.role === 'assistant'
                    }
                  />
                ))}

                {/* Inline error message */}
                {error && !isLoading && (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20 ring-2 ring-background">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-5 py-4 text-sm shadow-sm dark:border-red-900/50 dark:bg-red-950/30">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <span className="text-base">⚠️</span>
                        <span className="font-semibold">{t('ai.chat.error')}</span>
                      </div>
                      <p className="text-red-600/80 dark:text-red-300/80 text-xs">
                        {error instanceof Error ? error.message : t('ai.chat.connectionError')}
                      </p>
                      <button
                        onClick={() => {
                          const lastUserMessage = [...messages]
                            .reverse()
                            .find((m) => m.role === 'user')
                          if (lastUserMessage) {
                            // @ts-expect-error - sendMessage supports string or payload
                            sendMessage(lastUserMessage.content)
                          }
                        }}
                        className="mt-1 self-start rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                      >
                        {t('ai.chat.retry')}
                      </button>
                    </div>
                  </m.div>
                )}

                {isLoading && visibleMessages.at(-1)?.role !== 'assistant' && (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 ring-2 ring-background">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/40 bg-card/50 px-5 py-4 shadow-sm backdrop-blur-sm">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500/60 delay-0" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500/60 delay-150" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500/60 delay-300" />
                    </div>
                  </m.div>
                )}
                <div ref={bottomRef} className="h-4" />
              </div>
            )}
          </div>

          {/* --- Input Area --- */}
          <section
            aria-label="File drop zone"
            className="relative z-10 border-t border-white/10 bg-white/40 p-6 backdrop-blur-xl dark:bg-black/40"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mx-auto max-w-4xl">
              {/* Attachments Preview */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-4 flex gap-3 overflow-x-auto pb-2"
                  >
                    {attachments.map((file) => (
                      <div
                        key={file.name}
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
                          onClick={() => removeAttachment(attachments.indexOf(file))}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-md opacity-0 transition-all group-hover:opacity-100 hover:scale-110"
                          title={`Remove ${file.name}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </m.div>
                )}
              </AnimatePresence>

              {/* Input Bar */}
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.json,.md,.yaml,.yml,.xml,.log,.ts,.tsx,.js,.jsx,.py,.html,.css"
                aria-label="Upload files"
              />
              <InputGroup className="items-end gap-2 rounded-[2rem] border-white/20 bg-white/60 p-2 shadow-xl shadow-indigo-500/5 transition-all dark:bg-black/40 has-[textarea:focus-visible]:border-indigo-500/50 has-[textarea:focus-visible]:bg-white has-[textarea:focus-visible]:ring-4 has-[textarea:focus-visible]:ring-indigo-500/10 dark:has-[textarea:focus-visible]:bg-black/60">
                <InputGroupAddon className="py-0">
                  <InputGroupButton
                    variant="ghost"
                    size="icon-sm"
                    className="h-11 w-11 shrink-0 rounded-full text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                  >
                    <Paperclip size={20} />
                  </InputGroupButton>
                </InputGroupAddon>

                <InputGroupTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (isAgentActive) handleSend()
                    }
                  }}
                  placeholder={(() => {
                    if (!isOnline) return t('ai.chat.offline')
                    if (!isAgentActive) return t('ai.chat.agentInactive')
                    return t('ai.chat.placeholder')
                  })()}
                  disabled={isLoading || !isOnline || !isAgentActive}
                  className="min-h-11 max-h-40 resize-none border-0 bg-transparent py-2.5 text-base placeholder:text-muted-foreground/50"
                />

                <InputGroupAddon align="inline-end" className="py-0">
                  {isLoading ? (
                    <InputGroupButton
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => stop()}
                      className="h-11 w-11 shrink-0 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                      <StopCircle size={20} />
                    </InputGroupButton>
                  ) : (
                    <InputGroupButton
                      onClick={() => handleSend()}
                      disabled={
                        (!input.trim() && attachments.length === 0) || !isOnline || !isAgentActive
                      }
                      className={cn(
                        'h-11 w-11 shrink-0 rounded-full shadow-lg transition-all duration-300',
                        input.trim() || attachments.length > 0
                          ? 'bg-linear-to-br from-indigo-500 to-purple-600 text-white hover:shadow-indigo-500/25 hover:scale-105'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                      size="icon-sm"
                    >
                      <ArrowUp size={20} />
                    </InputGroupButton>
                  )}
                </InputGroupAddon>
              </InputGroup>
            </div>
          </section>

          {/* Preview Modal */}
          <AnimatePresence>
            {isPreviewOpen && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
                onClick={() => setIsPreviewOpen(null)}
              >
                <button
                  className="absolute right-6 top-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
                  onClick={() => setIsPreviewOpen(null)}
                  title="Close preview"
                >
                  <X size={28} />
                </button>
                <m.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  src={isPreviewOpen}
                  alt="Preview"
                  className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
                  onClick={(e: React.MouseEvent<HTMLImageElement>) => e.stopPropagation()}
                />
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </LazyMotion>
    </ActionStatesProvider>
  )
}
