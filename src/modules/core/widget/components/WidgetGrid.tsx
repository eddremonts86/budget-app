import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useWidgetConfig, type EnrichedWidget } from '../config/widget-config'
import { useWidgetEditMode } from '../config/widget-edit-mode'
import { SortableWidgetItem } from './SortableWidgetItem'
import { WidgetRenderer } from './WidgetRenderer'

const measuring = {
  droppable: { strategy: MeasuringStrategy.Always },
}

interface WidgetGridProps {
  /** Only show widgets from a specific module */
  moduleId?: string
  /** Override the grid class */
  className?: string
}

export function WidgetGrid({ moduleId, className }: WidgetGridProps) {
  const { visibleWidgets, reorderWidgets, resizeWidget } = useWidgetConfig()
  const { editing } = useWidgetEditMode()
  const [activeWidget, setActiveWidget] = useState<EnrichedWidget | null>(null)

  const widgets = moduleId ? visibleWidgets.filter((w) => w.moduleId === moduleId) : visibleWidgets

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart(event: DragStartEvent) {
    const widget = widgets.find((w) => w.qualifiedId === event.active.id)
    setActiveWidget(widget ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveWidget(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = widgets.findIndex((w) => w.qualifiedId === active.id)
    const newIndex = widgets.findIndex((w) => w.qualifiedId === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(widgets, oldIndex, newIndex)
    reorderWidgets(reordered.map((w) => w.qualifiedId))
  }

  function handleDragCancel() {
    setActiveWidget(null)
  }

  const handleResize = useCallback(
    (qualifiedId: string) => (colSpan: number, rowSpan: number | null) => {
      resizeWidget(qualifiedId, colSpan, rowSpan)
    },
    [resizeWidget],
  )

  if (widgets.length === 0) return null

  const sortableIds = widgets.map((w) => w.qualifiedId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
        <div
          className={
            className ??
            'masonry-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-4'
          }
        >
          {widgets.map((widget) => (
            <SortableWidgetItem
              key={widget.qualifiedId}
              id={widget.qualifiedId}
              colSpan={widget.colSpan}
              rowSpan={widget.rowSpan}
              onResize={handleResize(widget.qualifiedId)}
            >
              <WidgetRenderer widgetId={widget.qualifiedId} />
            </SortableWidgetItem>
          ))}
        </div>
      </SortableContext>

      {/* Floating drag preview */}
      {editing
        ? createPortal(
            <DragOverlay
              dropAnimation={{
                duration: 180,
                easing: 'cubic-bezier(0.2, 0, 0, 1)',
              }}
            >
              {activeWidget ? (
                <div className="rounded-xl border border-primary/20 bg-card shadow-2xl ring-2 ring-primary/30 opacity-90 max-w-[600px] overflow-hidden pointer-events-none">
                  <WidgetRenderer widgetId={activeWidget.qualifiedId} />
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )
        : null}
    </DndContext>
  )
}
