import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConversationPanel } from '@/modules/ai/components/ConversationPanel'
import type { Conversation } from '@/modules/ai/storage/chat-storage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}))

vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    return ({ children, ...props }: React.ComponentProps<any>) => {
      const {
        initial: _i,
        animate: _a,
        exit: _e,
        transition: _t,
        variants: _v,
        whileHover: _wh,
        whileTap: _wt,
        layout: _l,
        ...rest
      } = props as Record<string, unknown>
      const Tag = tag as any
      return <Tag {...(rest as any)}>{children}</Tag>
    }
  }
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, prop) => createMotionComponent(String(prop)),
    },
  )
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: motionProxy,
    m: motionProxy,
    LazyMotion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    domAnimation: {},
  }
})

vi.mock('@/shared/utils/index', () => ({
  cn: (...classes: Array<string | boolean | undefined>) => classes.filter(Boolean).join(' '),
}))

function createConversation(overrides: Partial<Conversation> = {}): Conversation {
  const now = Date.now()
  return {
    id: `conv_${Math.random().toString(36).slice(2)}`,
    userId: 'user_1',
    title: 'Test conversation',
    messages: [{ role: 'user', content: 'Hello' }],
    actionStates: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('ConversationPanel', () => {
  const defaultProps = {
    conversations: [] as Conversation[],
    activeId: null as string | null,
    onSelect: vi.fn(),
    onNew: vi.fn(),
    onDelete: vi.fn(),
    onDeleteAll: vi.fn(),
    isOpen: false,
    onToggle: vi.fn(),
    userRole: 'user' as const,
    currentUserId: 'user_1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(cleanup)

  it('shows toggle button when panel is closed', () => {
    render(<ConversationPanel {...defaultProps} />)
    expect(screen.getByTitle('ai.chat.conversations')).toBeDefined()
  })

  it('shows panel header and empty state when opened with no conversations', () => {
    render(<ConversationPanel {...defaultProps} isOpen={true} />)
    expect(screen.getByText('ai.chat.conversations')).toBeDefined()
    expect(screen.getByText('ai.chat.noConversations')).toBeDefined()
  })

  it('renders conversations and calls onSelect when clicking one', () => {
    const conv = createConversation({ title: 'Selectable Chat' })
    render(<ConversationPanel {...defaultProps} conversations={[conv]} isOpen={true} />)

    fireEvent.click(screen.getByText('Selectable Chat'))
    expect(defaultProps.onSelect).toHaveBeenCalledWith(conv.id)
  })

  it('shows delete-all confirmation and calls onDeleteAll', () => {
    const conv = createConversation({ title: 'Delete me' })
    render(<ConversationPanel {...defaultProps} conversations={[conv]} isOpen={true} />)

    fireEvent.click(screen.getByText('ai.chat.deleteAll'))
    expect(screen.getByText('ai.chat.confirmDeleteAll')).toBeDefined()

    fireEvent.click(screen.getByText('common.confirm'))
    expect(defaultProps.onDeleteAll).toHaveBeenCalledOnce()
  })
})
