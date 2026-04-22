import { AnimatePresence, m } from 'framer-motion'
import { MessageSquarePlus, MessagesSquare, Trash2, X, ShieldAlert, Search } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  Badge,
  Input,
  ScrollArea,
  Avatar,
  AvatarFallback,
} from '@/components/ui'
import type { Conversation } from '@/modules/ai/storage/chat-storage'
import { cn } from '@/shared/utils/index'

// --- Types ---

interface ConversationPanelProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onDeleteAll: () => void
  isOpen: boolean
  onToggle: () => void
  userRole?: 'admin' | 'user'
  currentUserId?: string | null
}

// --- Helpers ---

type DateGroup = 'today' | 'yesterday' | 'previousDays' | 'older'

function getDateGroup(timestamp: number): DateGroup {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86_400_000
  const weekStart = todayStart - 6 * 86_400_000

  if (timestamp >= todayStart) return 'today'
  if (timestamp >= yesterdayStart) return 'yesterday'
  if (timestamp >= weekStart) return 'previousDays'
  return 'older'
}

function groupConversations(conversations: Conversation[]): Record<DateGroup, Conversation[]> {
  const groups: Record<DateGroup, Conversation[]> = {
    today: [],
    yesterday: [],
    previousDays: [],
    older: [],
  }
  for (const conv of conversations) {
    groups[getDateGroup(conv.updatedAt)].push(conv)
  }
  return groups
}

// --- Component ---

export function ConversationPanel({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onDeleteAll,
  isOpen,
  onToggle,
  userRole = 'user',
  currentUserId,
}: ConversationPanelProps) {
  const { t } = useTranslation()
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<'my-chats' | 'all-chats'>('my-chats')

  // Filter conversations based on role, tab, and search
  const filteredConversations = React.useMemo(() => {
    let filtered = conversations

    // RBAC Filter
    if (userRole === 'admin') {
      if (activeTab === 'my-chats' && currentUserId) {
        filtered = filtered.filter((c) => c.userId === currentUserId)
      }
      // 'all-chats' shows everything (no filter needed beyond initial fetch)
    } else {
      // Regular users only see theirs (already filtered by parent, but safe to enforce)
      if (currentUserId) {
        filtered = filtered.filter((c) => c.userId === currentUserId)
      }
    }

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(query))
    }

    return filtered
  }, [conversations, userRole, activeTab, currentUserId, searchQuery])

  const groups = React.useMemo(
    () => groupConversations(filteredConversations),
    [filteredConversations],
  )
  const groupOrder: DateGroup[] = ['today', 'yesterday', 'previousDays', 'older']

  const handleDelete = (id: string) => {
    setConfirmDeleteId(null)
    onDelete(id)
  }

  const handleDeleteAll = () => {
    setConfirmDeleteAll(false)
    onDeleteAll()
  }

  const getGroupLabel = (group: DateGroup) => {
    switch (group) {
      case 'today':
        return t('ai.chat.today', 'Today')
      case 'yesterday':
        return t('ai.chat.yesterday', 'Yesterday')
      case 'previousDays':
        return t('ai.chat.previousDays', 'Previous 7 Days')
      case 'older':
        return t('ai.chat.older', 'Older')
    }
  }

  return (
    <>
      {/* Toggle button (visible when panel is closed) */}
      {!isOpen && (
        <m.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onToggle}
          className="absolute left-4 top-24 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/60 shadow-lg backdrop-blur-md transition-all hover:bg-white/80 hover:shadow-xl dark:bg-black/40 dark:hover:bg-black/60"
          title={t('ai.chat.conversations')}
        >
          <MessagesSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
          {userRole === 'admin' && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
          )}
        </m.button>
      )}

      {/* Slide-in panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
            />

            {/* Panel */}
            <m.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 top-0 z-40 flex w-80 flex-col border-r border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/80"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/5 p-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {t('ai.chat.conversations', 'Chats')}
                  </h2>
                  {userRole === 'admin' && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
                    >
                      <ShieldAlert size={10} />
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNew}>
                    <MessageSquarePlus size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
                    <X size={18} />
                  </Button>
                </div>
              </div>

              {/* Admin Tabs */}
              {userRole === 'admin' && (
                <div className="px-4 pt-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'my-chats' | 'all-chats')}
                    className="w-full"
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="my-chats" className="flex-1">
                        {t('ai.chat.myChats', 'My Chats')}
                      </TabsTrigger>
                      <TabsTrigger value="all-chats" className="flex-1">
                        {t('ai.chat.allChats', 'All Chats')}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {/* Search */}
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('ai.chat.searchPlaceholder', 'Search chats...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 bg-muted/50 border-transparent focus:bg-background transition-colors"
                  />
                </div>
              </div>

              {/* List */}
              <ScrollArea className="flex-1 px-3">
                <div className="flex flex-col gap-6 pb-4">
                  {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                      <MessagesSquare className="mb-2 h-10 w-10 opacity-20" />
                      <p className="text-sm">
                        {t('ai.chat.noConversations', 'No conversations found')}
                      </p>
                    </div>
                  ) : (
                    groupOrder.map((group) => {
                      const groupItems = groups[group]
                      if (groupItems.length === 0) return null

                      return (
                        <div key={group} className="space-y-2">
                          <h3 className="px-2 text-xs font-medium text-muted-foreground/70">
                            {getGroupLabel(group)}
                          </h3>
                          <div className="space-y-1">
                            {groupItems.map((conv) => (
                              <div
                                key={conv.id}
                                role="button"
                                tabIndex={0}
                                className={cn(
                                  'group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                                  activeId === conv.id
                                    ? 'bg-indigo-50 text-indigo-900 shadow-sm ring-1 ring-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-100 dark:ring-indigo-500/30'
                                    : 'hover:bg-black/5 dark:hover:bg-white/5',
                                )}
                                onClick={() => onSelect(conv.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    onSelect(conv.id)
                                  }
                                }}
                              >
                                {/* Chat Icon / Avatar */}
                                {userRole === 'admin' && activeTab === 'all-chats' ? (
                                  <Avatar className="h-8 w-8 shrink-0 border border-black/5">
                                    <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                      {conv.userId?.toString()?.slice(0, 2)?.toUpperCase() || '??'}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div
                                    className={cn(
                                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                                      activeId === conv.id
                                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-300'
                                        : 'bg-black/5 text-muted-foreground dark:bg-white/10',
                                    )}
                                  >
                                    <MessagesSquare size={14} />
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <p
                                    className={cn(
                                      'truncate text-sm font-medium',
                                      activeId === conv.id ? 'font-semibold' : '',
                                    )}
                                  >
                                    {conv.title || t('ai.chat.newConversation')}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground/80">
                                    {new Date(conv.updatedAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {userRole === 'admin' && activeTab === 'all-chats' && (
                                      <span className="ml-1 opacity-70">
                                        • User: {conv.userId?.toString()?.slice(0, 6)}...
                                      </span>
                                    )}
                                  </p>
                                </div>

                                {/* Actions */}
                                <div className="absolute right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  {confirmDeleteId === conv.id ? (
                                    <div className="flex items-center gap-1 rounded-md bg-white p-0.5 shadow-lg dark:bg-black">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(conv.id)
                                        }}
                                      >
                                        <Trash2 size={12} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setConfirmDeleteId(null)
                                        }}
                                      >
                                        <X size={12} />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setConfirmDeleteId(conv.id)
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              <div className="border-t border-black/5 p-4 dark:border-white/5">
                {confirmDeleteAll ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10">
                    <p className="text-center text-xs font-medium text-red-800 dark:text-red-200">
                      {t('ai.chat.confirmDeleteAll')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                        onClick={() => setConfirmDeleteAll(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={handleDeleteAll}
                      >
                        {t('common.confirm')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:border-red-900/30 dark:hover:bg-red-900/10"
                    onClick={() => setConfirmDeleteAll(true)}
                    disabled={filteredConversations.length === 0}
                  >
                    <Trash2 size={14} className="mr-2" />
                    {t('ai.chat.deleteAll')}
                  </Button>
                )}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
