'use client'

import { Pin, WifiOff, X } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/shared/lib/utils'

function useSheetPing(enabled = true) {
  const [latencyMs, setLatencyMs] = React.useState<number | null>(null)
  const [isOnline, setIsOnline] = React.useState(true)

  const ping = React.useCallback(async () => {
    if (!enabled || typeof window === 'undefined') return
    if (!navigator.onLine) {
      setIsOnline(false)
      setLatencyMs(null)
      return
    }
    const startedAt = performance.now()
    try {
      await fetch('/', {
        method: 'HEAD',
        cache: 'no-store',
      })
      setIsOnline(true)
      setLatencyMs(Math.max(1, Math.round(performance.now() - startedAt)))
    } catch {
      setIsOnline(false)
      setLatencyMs(null)
    }
  }, [enabled])

  React.useEffect(() => {
    if (!enabled) return
    ping()
    const intervalId = window.setInterval(ping, 30000)
    const onOnline = () => ping()
    const onOffline = () => {
      setIsOnline(false)
      setLatencyMs(null)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [enabled, ping])

  return {
    isOnline,
    latencyMs,
    ping,
  }
}

// --- Pin context -------------------------------------------------------
const CrudPinContext = React.createContext<{
  pinned: boolean
  onPinToggle: () => void
  pinnable: boolean
} | null>(null)

function useCrudPin() {
  return React.useContext(CrudPinContext)
}
// -----------------------------------------------------------------------

export function CrudSheetContent({
  className,
  pinnable = false,
  children,
  ...props
}: React.ComponentProps<typeof SheetContent> & { pinnable?: boolean }) {
  const [pinned, setPinned] = React.useState(false)

  return (
    <CrudPinContext.Provider value={{ pinned, onPinToggle: () => setPinned((p) => !p), pinnable }}>
      <SheetContent
        showCloseButton={false}
        onInteractOutside={pinned ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={pinned ? (e) => e.preventDefault() : undefined}
        className={cn(
          'sm:max-w-[560px] border-l border-border/40 backdrop-blur-3xl bg-background/80 flex flex-col p-0',
          className,
        )}
        {...props}
      >
        {children}
      </SheetContent>
    </CrudPinContext.Provider>
  )
}

interface CrudSheetHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  onClose: () => void
  actionsSlot?: React.ReactNode
  showPing?: boolean
}

export function CrudSheetHeader({
  title,
  description,
  onClose,
  actionsSlot,
  showPing = true,
}: CrudSheetHeaderProps) {
  const { isOnline, latencyMs, ping } = useSheetPing(showPing)
  const pinCtx = useCrudPin()

  return (
    <SheetHeader className="gap-1.5 p-4 border-b px-6 h-16 flex flex-row items-center justify-between space-y-0">
      <div className="flex items-center gap-2 min-w-0">
        <SheetTitle className="flex items-center gap-2">{title}</SheetTitle>
        {description ? (
          <SheetDescription className="hidden sm:inline-block ml-2 truncate">
            {description}
          </SheetDescription>
        ) : null}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {showPing ? (
          <button
            type="button"
            onClick={ping}
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border',
              isOnline
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : 'bg-red-500/10 text-red-600 border-red-500/20',
            )}
            title="Ping"
          >
            <span
              className={cn('size-1.5 rounded-full', isOnline ? 'bg-green-500' : 'bg-red-500')}
            />
            {isOnline ? `${latencyMs ?? '-'}ms` : <WifiOff className="h-3 w-3" />}
          </button>
        ) : null}
        {actionsSlot}
        {pinCtx?.pinnable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              pinCtx.pinned
                ? 'text-primary bg-primary/10 hover:bg-primary/20'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={pinCtx.onPinToggle}
            title={pinCtx.pinned ? 'Unpin' : 'Pin open'}
          >
            <Pin className={cn('size-4', pinCtx.pinned && 'fill-current')} />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          title="Close"
        >
          <X className="size-4" />
        </Button>
      </div>
    </SheetHeader>
  )
}

export function CrudSheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex-1 overflow-y-auto p-6 space-y-6', className)} {...props} />
}

export function CrudSheetSection({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4',
        className,
      )}
      {...props}
    />
  )
}

export function CrudSheetActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'p-6 pt-4 border-t border-border/40 mt-auto grid grid-cols-2 gap-2 [&>*]:w-full',
        className,
      )}
      {...props}
    />
  )
}
