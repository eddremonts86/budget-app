import { getEnabledModules } from '../../registry'
import type { WidgetDefinition } from '../../types'

export interface ResolvedWidget extends WidgetDefinition {
  /** Fully qualified id: `moduleId:widgetId` */
  qualifiedId: string
  moduleId: string
}

/**
 * Collects all widgets declared by enabled modules.
 * Each widget gets a `qualifiedId` in the form `moduleId:widgetId`.
 */
export function getRegisteredWidgets(): ResolvedWidget[] {
  const modules = getEnabledModules()

  return modules.flatMap((mod) =>
    (mod.widgets ?? []).map((widget) => ({
      ...widget,
      moduleId: mod.id,
      qualifiedId: `${mod.id}:${widget.id}`,
    })),
  )
}

const widgetCache = new Map<string, ResolvedWidget>()

export function getWidgetById(qualifiedId: string): ResolvedWidget | undefined {
  if (widgetCache.size === 0) {
    for (const widget of getRegisteredWidgets()) {
      widgetCache.set(widget.qualifiedId, widget)
    }
  }
  return widgetCache.get(qualifiedId)
}
