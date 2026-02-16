'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquarePlus, MessagesSquare, MoreHorizontal, Trash2, X } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import type { Conversation } from '@/shared/lib/storage/chat-storage'
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
}

// --- Helpers ---

type DateGroup = 'today' | 'yesterday' | 'previousDays' | 'older'

function getDateGroup(timestamp: number): DateGroup {
  const now = new Date()
  const date = new Date(timestamp)
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
}: ConversationPanelProps) {
  const { t } = useTranslation()
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = React.useState(false)

  const groups = React.useMemo(() => groupConversations(conversations), [conversations])
  const groupOrder: DateGroup[] = ['today', 'yesterday', 'previousDays', 'older']

  const handleDelete = (id: string) => {
    setConfirmDeleteId(null)
    onDelete(id)
  }

  const handleDeleteAll = () => {
    setConfirmDeleteAll(false)
    onDeleteAll()
  }

  return (
    <>
      {/* Toggle button (visible when panel is closed) */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onToggle}
          className="absolute left-4 top-24 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/60 shadow-lg backdrop-blur-md transition-all hover:bg-white/80 hover:shadow-xl dark:bg-black/40 dark:hover:bg-black/60"
          title={t('ai.chat.conversations')}
        >
          <MessagesSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
        </motion.button>
      )}

      {/* Slide-in panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[2px] md:hidden"
              onClick={onToggle}
            />

            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 z-30 flex w-80 flex-col border-r border-white/10 bg-white/80 backdrop-blur-xl dark:bg-black/60"
            >
              {/* Panel header */}
              <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
                <div className="flex items-center gap-2.5">
                  <MessagesSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold tracking-tight text-foreground">
                    {t('ai.chat.conversations')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20"
                    onClick={onNew}
                    title={t('ai.chat.newConversation')}
                  >
                    <MessageSquarePlus size={16} />
                  </Button>
                  {conversations.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirmDeleteAll(true)}
                      title={t('ai.chat.deleteAllConversations')}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={onToggle}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-indigo-500/10">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessagesSquare size={40} className="mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground/60">
                      {t('ai.chat.noConversations')}
                    </p>
                  </div>
                ) : (
                  groupOrder.map((group) => {
                    const items = groups[group]
                    if (items.length === 0) return null
                    return (
                      <div key={group} className="mb-4">
                        <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                          {t(`ai.chat.${group}`)}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {items.map((conv) => (
                            <ConversationItem
                              key={conv.id}
                              conversation={conv}
                              isActive={conv.id === activeId}
                              onSelect={() => onSelect(conv.id)}
                              onDelete={() => setConfirmDeleteId(conv.id)}
                              isConfirmingDelete={confirmDeleteId === conv.id}
                              onConfirmDelete={() => handleDelete(conv.id)}
                              onCancelDelete={() => setConfirmDeleteId(null)}
                              t={t}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Delete all confirmation */}
              <AnimatePresence>
                {confirmDeleteAll && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="border-t border-white/10 bg-destructive/5 p-4"
                  >
                    <p className="mb-3 text-xs font-medium text-foreground">
                      {t('ai.chat.confirmDeleteAll')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={handleDeleteAll}
                      >
                        {t('ai.chat.deleteAllConversations')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setConfirmDeleteAll(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// --- Conversation Item ---

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  isConfirmingDelete: boolean
  onConfirmDelete: () => void
  onCancelDelete: () => void
  t: (key: string) => string
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  isConfirmingDelete,
  onConfirmDelete,
  onCancelDelete,
  t,
}: ConversationItemProps) {
  const title = conversation.title || t('ai.chat.untitledConversation')
  const msgCount = conversation.messages.filter((m) => m.role === 'user').length

  if (isConfirmingDelete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-destructive/20 bg-destructive/5 p-3"
      >
        <p className="mb-2 text-[11px] text-foreground">{t('ai.chat.confirmDeleteConversation')}</p>
        <div className="flex gap-1.5">
          <Button
            variant="destructive"
            size="sm"
            className="h-7 flex-1 text-[10px]"
            onClick={onConfirmDelete}
          >
            <Trash2 size={12} className="mr-1" />
            {t('ai.chat.deleteConversation')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 flex-1 text-[10px]"
            onClick={onCancelDelete}
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200',
        isActive
          ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm'
          : 'hover:bg-muted/50 text-foreground/80',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium leading-tight">{title}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground/60">
          {msgCount} {msgCount === 1 ? 'msg' : 'msgs'} ·{' '}
          {new Date(conversation.updatedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
      >
        <MoreHorizontal size={14} />
      </button>
    </button>
  )
}
