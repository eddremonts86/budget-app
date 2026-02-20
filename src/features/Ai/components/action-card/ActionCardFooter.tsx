import {
  AlertTriangle,
  Check,
  Loader2,
  Lock,
  Trash2,
  X,
} from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/shared/utils/index'
import type { ActionVerb } from '../ActionConfirmationCard.utils'

interface ActionCardFooterProps {
  status: 'idle' | 'loading' | 'success' | 'error' | 'denied'
  verb: ActionVerb
  visualConfig: {
    color: string
  }
  onConfirm: () => void
  onCancel: () => void // Note: onCancel logic was implicitly "do nothing" or handled by parent/UI state, but here we might need it if we want a cancel button.
  // In the original code, there was no explicit Cancel button action other than visual state, 
  // but looking at the snippet, there is a Cancel button that does `setStatus('denied')` or similar?
  // Let's check the original code snippet for the footer actions.
  // The original code has:
  // Button onClick={handleConfirm}
  // Button variant="ghost" onClick={() => setStatus('denied')}
  
  // So we need setStatus equivalent passed down or handlers.
  resultMessage: string
  confirmText: string
  cancelText: string
  isSpanish: boolean
}

export function ActionCardFooter({
  status,
  verb,
  visualConfig,
  onConfirm,
  onCancel,
  resultMessage,
  confirmText,
  cancelText,
  isSpanish,
}: ActionCardFooterProps) {
  return (
    <div className="px-4 py-2.5 border-t border-border/30 flex items-center gap-2 bg-background/50">
      {status === 'idle' && (
        <>
          <Button
            size="sm"
            onClick={onConfirm}
            className={cn(
              'gap-1.5 text-xs font-semibold bg-gradient-to-r text-white',
              visualConfig.color,
            )}
          >
            {verb === 'delete' ? <Trash2 size={14} /> : <Check size={14} />}
            {confirmText}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X size={14} className="mr-1" />
            {cancelText}
          </Button>
        </>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={14} className="animate-spin text-primary" />
          <span className="italic">{isSpanish ? 'Procesando...' : 'Processing...'}</span>
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
          <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-1">
            <Check size={12} />
          </div>
          {resultMessage}
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
          <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-1">
            <AlertTriangle size={12} />
          </div>
          {resultMessage}
        </div>
      )}

      {status === 'denied' && (
        <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
          <div className="rounded-full bg-orange-100 dark:bg-orange-900/50 p-1">
            <Lock size={12} />
          </div>
          {resultMessage}
        </div>
      )}
    </div>
  )
}
