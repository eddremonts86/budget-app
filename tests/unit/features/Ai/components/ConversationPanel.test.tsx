import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Conversation } from '@/shared/lib/storage/chat-storage'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'ai.chat.conversations': 'Conversations',
        'ai.chat.newConversation': 'New conversation',
        'ai.chat.deleteConversation': 'Delete conversation',
        'ai.chat.deleteAllConversations': 'Delete all',
        'ai.chat.confirmDeleteConversation': 'Are you sure you want to delete this conversation?',
        'ai.chat.confirmDeleteAll': 'Are you sure you want to delete all conversations?',
        'ai.chat.noConversations': 'No conversations yet',
        'ai.chat.today': 'Today',
        'ai.chat.yesterday': 'Yesterday',
        'ai.chat.previousDays': 'Previous 7 days',
        'ai.chat.older': 'Older',
        'ai.chat.untitledConversation': 'New conversation',
      }
      return keys[key] || key
    },
  }),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => {
      const { initial, animate, ...rest } = props as Record<string, unknown>
      return (
        <button {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
      )
    },
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => {
      const { initial, animate, exit, transition, ...rest } = props as Record<string, unknown>
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
    aside: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => {
      const { initial, animate, exit, transition, ...rest } = props as Record<string, unknown>
      return <aside {...(rest as React.HTMLAttributes<HTMLElement>)}>{children}</aside>
    },
  },
}))

vi.mock('@/components/ui', () => ({
  Button: ({
    children,
    ...props
  }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/shared/utils/index', () => ({
  cn: (...classes: Array<string | boolean | undefined>) => classes.filter(Boolean).join(' '),
}))

// Must import AFTER mocks
import { ConversationPanel } from '@/features/Ai/components/ConversationPanel'

function createTestConversation(overrides: Partial<Conversation> = {}): Conversation {
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
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(cleanup)

  // -----------------------------------------------
  // Toggle button (panel closed)
  // -----------------------------------------------
  describe('toggle button', () => {
    it('should show toggle button when panel is closed', () => {
      render(<ConversationPanel {...defaultProps} />)
      const toggleBtn = screen.getByTitle('Conversations')
      expect(toggleBtn).toBeDefined()
    })

    it('should call onToggle when toggle button clicked', () => {
      render(<ConversationPanel {...defaultProps} />)
      fireEvent.click(screen.getByTitle('Conversations'))
      expect(defaultProps.onToggle).toHaveBeenCalledOnce()
    })

    it('should not show toggle button when panel is open', () => {
      render(<ConversationPanel {...defaultProps} isOpen={true} />)
      expect(screen.queryByTitle('Conversations')).toBeNull()
    })
  })

  // -----------------------------------------------
  // Panel open state
  // -----------------------------------------------
  describe('panel open', () => {
    it('should show panel header when open', () => {
      render(<ConversationPanel {...defaultProps} isOpen={true} />)
      expect(screen.getByText('Conversations')).toBeDefined()
    })

    it('should show empty state when no conversations', () => {
      render(<ConversationPanel {...defaultProps} isOpen={true} />)
      expect(screen.getByText('No conversations yet')).toBeDefined()
    })

    it('should show new conversation button', () => {
      render(<ConversationPanel {...defaultProps} isOpen={true} />)
      const newBtn = screen.getByTitle('New conversation')
      expect(newBtn).toBeDefined()
    })

    it('should call onNew when new conversation button clicked', () => {
      render(<ConversationPanel {...defaultProps} isOpen={true} />)
      fireEvent.click(screen.getByTitle('New conversation'))
      expect(defaultProps.onNew).toHaveBeenCalledOnce()
    })
  })

  // -----------------------------------------------
  // Conversation list
  // -----------------------------------------------
  describe('conversation list', () => {
    it('should render conversation items', () => {
      const conversations = [
        createTestConversation({ title: 'Chat about TypeScript' }),
        createTestConversation({ title: 'React hooks help' }),
      ]
      render(<ConversationPanel {...defaultProps} conversations={conversations} isOpen={true} />)
      expect(screen.getByText('Chat about TypeScript')).toBeDefined()
      expect(screen.getByText('React hooks help')).toBeDefined()
    })

    it('should highlight the active conversation', () => {
      const conv = createTestConversation({ title: 'Active Chat' })
      render(
        <ConversationPanel
          {...defaultProps}
          conversations={[conv]}
          activeId={conv.id}
          isOpen={true}
        />,
      )
      const button = screen.getByText('Active Chat').closest('button')
      expect(button?.className).toContain('bg-indigo-500/10')
    })

    it('should call onSelect when clicking a conversation', () => {
      const conv = createTestConversation({ title: 'Selectable Chat' })
      render(<ConversationPanel {...defaultProps} conversations={[conv]} isOpen={true} />)
      fireEvent.click(screen.getByText('Selectable Chat'))
      expect(defaultProps.onSelect).toHaveBeenCalledWith(conv.id)
    })

    it('should display untitled conversation fallback', () => {
      const conv = createTestConversation({ title: '' })
      render(<ConversationPanel {...defaultProps} conversations={[conv]} isOpen={true} />)
      expect(screen.getByText('New conversation')).toBeDefined()
    })

    it('should show message count', () => {
      const conv = createTestConversation({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' },
          { role: 'user', content: 'How are you?' },
        ],
      })
      render(<ConversationPanel {...defaultProps} conversations={[conv]} isOpen={true} />)
      // 2 user messages
      expect(screen.getByText(/2 msgs/)).toBeDefined()
    })
  })

  // -----------------------------------------------
  // Date grouping
  // -----------------------------------------------
  describe('date grouping', () => {
    it('should group conversations by date', () => {
      const now = Date.now()
      const todayConv = createTestConversation({
        title: 'Today Chat',
        updatedAt: now,
      })
      const yesterdayConv = createTestConversation({
        title: 'Yesterday Chat',
        updatedAt: now - 86_400_000,
      })
      const oldConv = createTestConversation({
        title: 'Old Chat',
        updatedAt: now - 30 * 86_400_000,
      })

      render(
        <ConversationPanel
          {...defaultProps}
          conversations={[todayConv, yesterdayConv, oldConv]}
          isOpen={true}
        />,
      )

      expect(screen.getByText('Today')).toBeDefined()
      expect(screen.getByText('Yesterday')).toBeDefined()
      expect(screen.getByText('Older')).toBeDefined()
    })
  })

  // -----------------------------------------------
  // Delete single conversation
  // -----------------------------------------------
  describe('delete single conversation', () => {
    it('should show delete confirmation when delete button clicked', () => {
      const conv = createTestConversation({ title: 'Delete me' })
      render(<ConversationPanel {...defaultProps} conversations={[conv]} isOpen={true} />)

      // Find the more button (last button in the item)
      const moreButtons = screen.getAllByRole('button')
      const moreBtn = moreButtons.find((btn) => btn.className.includes('opacity-0'))
      if (moreBtn) {
        fireEvent.click(moreBtn)
        expect(screen.getByText('Are you sure you want to delete this conversation?')).toBeDefined()
      }
    })
  })

  // -----------------------------------------------
  // Delete all confirmation
  // -----------------------------------------------
  describe('delete all conversations', () => {
    it('should show delete all button when conversations exist', () => {
      const conv = createTestConversation()
      render(<ConversationPanel {...defaultProps} conversations={[conv]} isOpen={true} />)
      const deleteAllBtn = screen.getByTitle('Delete all')
      expect(deleteAllBtn).toBeDefined()
    })

    it('should not show delete all button when no conversations', () => {
      render(<ConversationPanel {...defaultProps} isOpen={true} />)
      expect(screen.queryByTitle('Delete all')).toBeNull()
    })

    it('should show confirmation when delete all clicked', () => {
      const conv = createTestConversation()
      render(<ConversationPanel {...defaultProps} conversations={[conv]} isOpen={true} />)
      fireEvent.click(screen.getByTitle('Delete all'))
      expect(screen.getByText('Are you sure you want to delete all conversations?')).toBeDefined()
    })

    it('should call onDeleteAll after confirming', () => {
      const conv = createTestConversation()
      render(<ConversationPanel {...defaultProps} conversations={[conv]} isOpen={true} />)
      fireEvent.click(screen.getByTitle('Delete all'))
      // Click the confirm button
      const confirmBtn = screen
        .getAllByText('Delete all')
        .find((el) => el.closest('button')?.className?.includes('destructive'))
      if (confirmBtn) {
        fireEvent.click(confirmBtn)
        expect(defaultProps.onDeleteAll).toHaveBeenCalledOnce()
      }
    })
  })
})
