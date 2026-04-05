import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'

interface WidgetRefreshingIndicatorProps {
  label?: string
}

interface WidgetRefreshButtonProps {
  isRefreshing: boolean
  onRefresh: () => void
  label?: string
}

export function WidgetRefreshingIndicator({
  label = 'Updating...',
}: WidgetRefreshingIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      {label}
    </span>
  )
}

export function WidgetRefreshButton({
  isRefreshing,
  onRefresh,
  label = 'Refresh widget',
}: WidgetRefreshButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="h-8 w-8 shrink-0 rounded-full text-muted-foreground"
      onClick={onRefresh}
      disabled={isRefreshing}
      aria-label={label}
      title={label}
    >
      {isRefreshing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
    </Button>
  )
}
