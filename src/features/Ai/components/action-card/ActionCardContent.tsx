import { AlertTriangle } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/shared/utils/index'

interface ActionCardContentProps {
  dataEntries: [string, string][]
  visualConfig: {
    bgColor: string
  }
  warningText: string | null
  status: 'idle' | 'loading' | 'success' | 'error' | 'denied'
}

export function ActionCardContent({
  dataEntries,
  visualConfig,
  warningText,
  status,
}: ActionCardContentProps) {
  return (
    <>
      {/* Data Preview */}
      {dataEntries.length > 0 && (
        <div className={cn('px-4 py-3 space-y-1.5', visualConfig.bgColor)}>
          {dataEntries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <span className="font-semibold text-muted-foreground min-w-[90px] capitalize">
                {key}:
              </span>
              <span className="text-foreground">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warning for delete */}
      {warningText && status === 'idle' && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20 border-t border-red-200/30 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" />
          <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
            {warningText}
          </span>
        </div>
      )}
    </>
  )
}
