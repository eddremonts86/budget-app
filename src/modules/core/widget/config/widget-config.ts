import { useCallback, useSyncExternalStore } from 'react'
import type { WidgetSize } from '../../types'
import { getRegisteredWidgets, type ResolvedWidget } from '../registry/widget-registry'

const STORAGE_KEY = 'widget-config'

const DEFAULT_COL_SPAN: Record<WidgetSize, number> = {
  sm: 4,
  md: 6,
  lg: 8,
  full: 12,
}

interface WidgetVisibilityEntry {
  visible: boolean
  order?: number
  colSpan?: number
  rowSpan?: number | null
}

type WidgetConfigMap = Record<string, WidgetVisibilityEntry>

// ---------------------------------------------------------------------------
// In-memory store with external-store protocol for React 19
// ---------------------------------------------------------------------------

let snapshot: WidgetConfigMap = loadFromStorage()
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function loadFromStorage(): WidgetConfigMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WidgetConfigMap) : {}
  } catch {
    return {}
  }
}

function persist(next: WidgetConfigMap) {
  snapshot = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // quota exceeded — ignore
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return snapshot
}

const SERVER_SNAPSHOT: WidgetConfigMap = {}

function getServerSnapshot(): WidgetConfigMap {
  return SERVER_SNAPSHOT
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface EnrichedWidget extends ResolvedWidget {
  visible: boolean
  order: number
  colSpan: number
  rowSpan: number | null
}

export interface UseWidgetConfigReturn {
  /** All registered widgets enriched with current visibility */
  widgets: EnrichedWidget[]
  /** Only the visible widgets, sorted by order */
  visibleWidgets: EnrichedWidget[]
  /** Check if a specific widget is visible */
  isVisible: (qualifiedId: string) => boolean
  /** Toggle a widget on/off */
  toggleWidget: (qualifiedId: string) => void
  /** Set the explicit visibility of a widget */
  setWidgetVisibility: (qualifiedId: string, visible: boolean) => void
  /** Persist a new ordering for widgets given an ordered array of qualifiedIds */
  reorderWidgets: (orderedIds: string[]) => void
  /** Resize a widget by setting colSpan and/or rowSpan */
  resizeWidget: (qualifiedId: string, colSpan: number, rowSpan: number | null) => void
  /** Reset all widget config to defaults */
  resetToDefaults: () => void
}

export function useWidgetConfig(): UseWidgetConfigReturn {
  const config = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const registered = getRegisteredWidgets()

  const enriched: EnrichedWidget[] = registered.map((widget) => {
    const entry = config[widget.qualifiedId]
    return {
      ...widget,
      visible: entry?.visible ?? widget.defaultVisible ?? true,
      order: entry?.order ?? widget.defaultOrder ?? 999,
      colSpan: entry?.colSpan ?? DEFAULT_COL_SPAN[widget.size ?? 'lg'],
      rowSpan: entry?.rowSpan ?? null,
    }
  })

  const visibleWidgets = enriched.filter((w) => w.visible).sort((a, b) => a.order - b.order)

  const isVisible = useCallback(
    (qualifiedId: string) => {
      const entry = config[qualifiedId]
      if (entry) return entry.visible
      const widget = registered.find((w) => w.qualifiedId === qualifiedId)
      return widget?.defaultVisible ?? true
    },
    [config, registered],
  )

  const toggleWidget = useCallback((qualifiedId: string) => {
    const current = getSnapshot()
    const widget = getRegisteredWidgets().find((w) => w.qualifiedId === qualifiedId)
    const currentlyVisible = current[qualifiedId]?.visible ?? widget?.defaultVisible ?? true
    persist({
      ...current,
      [qualifiedId]: { ...current[qualifiedId], visible: !currentlyVisible },
    })
  }, [])

  const setWidgetVisibility = useCallback((qualifiedId: string, visible: boolean) => {
    const current = getSnapshot()
    persist({
      ...current,
      [qualifiedId]: { ...current[qualifiedId], visible },
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    persist({})
  }, [])

  const reorderWidgets = useCallback((orderedIds: string[]) => {
    const current = getSnapshot()
    const next = { ...current }
    orderedIds.forEach((id, index) => {
      next[id] = { ...next[id], visible: next[id]?.visible ?? true, order: index }
    })
    persist(next)
  }, [])

  const resizeWidget = useCallback(
    (qualifiedId: string, colSpan: number, rowSpan: number | null) => {
      const current = getSnapshot()
      persist({
        ...current,
        [qualifiedId]: { ...current[qualifiedId], colSpan, rowSpan },
      })
    },
    [],
  )

  return {
    widgets: enriched,
    visibleWidgets,
    isVisible,
    toggleWidget,
    setWidgetVisibility,
    reorderWidgets,
    resizeWidget,
    resetToDefaults,
  }
}
