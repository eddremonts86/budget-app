import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeftRight, Check, GripVertical, UnfoldVertical } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useWidgetEditMode } from '../config/widget-edit-mode'

/** Max grid columns at lg (12-column grid) */
const MAX_COLS = 12
const ROW_GAP = 16

const WIDTH_STEPS = [4, 6, 8, MAX_COLS] as const
const WIDTH_LABELS: Record<number, string> = {
  4: '⅓',
  6: '½',
  8: '⅔',
  12: 'Full',
}

interface SortableWidgetItemProps {
  id: string
  colSpan: number
  rowSpan: number | null
  onResize: (colSpan: number, rowSpan: number | null) => void
  children: ReactNode
}

export function SortableWidgetItem({
  id,
  colSpan,
  rowSpan: fixedRowSpan,
  onResize,
  children,
}: SortableWidgetItemProps) {
  const { editing } = useWidgetEditMode()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, over } =
    useSortable({ id, disabled: !editing })

  const innerRef = useRef<HTMLDivElement>(null)
  const [autoRowSpan, setAutoRowSpan] = useState(400)

  // ----- Drag-to-resize height -----
  const resizingRef = useRef(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)
  const [resizeDelta, setResizeDelta] = useState(0)

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      resizingRef.current = true
      startYRef.current = e.clientY
      const el = innerRef.current
      startHeightRef.current = el ? el.getBoundingClientRect().height : autoRowSpan
      setResizeDelta(0)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [autoRowSpan],
  )

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizingRef.current) return
    const delta = e.clientY - startYRef.current
    setResizeDelta(delta)
  }, [])

  const handleResizePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!resizingRef.current) return
      resizingRef.current = false
      const delta = e.clientY - startYRef.current
      const newHeight = Math.max(120, startHeightRef.current + delta + ROW_GAP)
      setResizeDelta(0)
      onResize(colSpan, newHeight)
    },
    [colSpan, onResize],
  )
  // ----- end resize -----

  // Measure natural content height for masonry
  useEffect(() => {
    const el = innerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
        setAutoRowSpan(height + ROW_GAP)
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Cycle width: 4 → 6 → 8 → 12 → 4
  const cycleWidth = useCallback(() => {
    const currentIdx = WIDTH_STEPS.indexOf(colSpan as (typeof WIDTH_STEPS)[number])
    const nextSpan = WIDTH_STEPS[(currentIdx + 1) % WIDTH_STEPS.length]
    onResize(nextSpan, fixedRowSpan)
  }, [colSpan, fixedRowSpan, onResize])

  // Reset height to auto
  const resetHeight = useCallback(() => {
    onResize(colSpan, null)
  }, [colSpan, onResize])

  /* eslint-disable react-hooks/refs -- intentional: refs track resize state for render-time display calculation */
  const displayRowSpan =
    resizingRef.current && resizeDelta !== 0
      ? Math.max(120, startHeightRef.current + resizeDelta + ROW_GAP)
      : (fixedRowSpan ?? autoRowSpan)
  /* eslint-enable react-hooks/refs */

  const isDropTarget = over?.id === id && !isDragging

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    '--row-span': displayRowSpan,
    '--col-span': colSpan,
    willChange: isDragging ? 'transform' : undefined,
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        '@container widget-grid-item group/widget relative masonry-item',
        isDragging && 'z-50 opacity-40 scale-[0.97]',
        editing && !isDragging && 'rounded-xl ring-1 ring-dashed ring-border/40',
        isDropTarget && 'ring-2 ring-primary/50 bg-primary/5 rounded-xl',
      )}
    >
      <div
        ref={innerRef}
        className="relative"
        style={
          fixedRowSpan || resizeDelta !== 0
            ? {
                height: `${resizeDelta !== 0 ? Math.max(120, startHeightRef.current + resizeDelta) : (fixedRowSpan ?? autoRowSpan) - ROW_GAP}px`, // eslint-disable-line react-hooks/refs
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {/* Edit-mode top toolbar */}
        {editing ? (
          <div
            className={cn(
              'absolute inset-x-0 -top-4 z-20 flex items-center justify-center',
              'opacity-0 transition-opacity duration-150',
              'group-hover/widget:opacity-100',
            )}
          >
            <div className="flex items-center gap-1 rounded-full border border-border/80 bg-popover px-1 py-0.5 shadow-lg">
              {/* Drag handle */}
              <button
                type="button"
                className={cn(
                  'flex h-7 cursor-grab items-center gap-1 rounded-full px-2',
                  'text-xs font-medium text-popover-foreground/70',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors active:cursor-grabbing',
                )}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-3.5 w-3.5" />
                <span>Move</span>
              </button>

              <div className="h-4 w-px bg-border/60" />

              {/* Cycle width */}
              <button
                type="button"
                onClick={cycleWidth}
                className={cn(
                  'flex h-7 items-center gap-1 rounded-full px-2',
                  'text-xs font-medium text-popover-foreground/70',
                  'hover:bg-accent hover:text-accent-foreground transition-colors',
                )}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>{WIDTH_LABELS[colSpan] ?? `${colSpan}/12`}</span>
              </button>

              <div className="h-4 w-px bg-border/60" />

              {/* Reset height (only shown when height is fixed) */}
              {fixedRowSpan ? (
                <button
                  type="button"
                  onClick={resetHeight}
                  className={cn(
                    'flex h-7 items-center gap-1 rounded-full px-2',
                    'text-xs font-medium text-primary',
                    'hover:bg-accent hover:text-accent-foreground transition-colors',
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Auto</span>
                </button>
              ) : (
                <span className="flex h-7 items-center px-2 text-xs text-popover-foreground/40">
                  <UnfoldVertical className="mr-1 h-3.5 w-3.5" />
                  Drag edge ↓
                </span>
              )}
            </div>
          </div>
        ) : null}

        {children}
      </div>

      {/* Bottom resize handle — drag to change height */}
      {editing ? (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          className={cn(
            'absolute inset-x-0 -bottom-1 z-20 flex h-3 cursor-ns-resize items-center justify-center',
            'opacity-0 transition-opacity duration-150',
            'group-hover/widget:opacity-100',
          )}
        >
          <div className="h-1 w-12 rounded-full bg-muted-foreground/40 transition-colors hover:bg-primary/60" />
        </div>
      ) : null}
    </div>
  )
}
