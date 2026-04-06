import type { Icon } from '@tabler/icons-react'
import type { ComponentType, ReactNode } from 'react'

export type AppModuleRouteKind = 'page' | 'layout' | 'api'
export type ModuleNavigationKind = 'main' | 'secondary'
export type ModuleActionId = 'open-ai-search'
export type ModuleBadgeId = 'pending-transactions' | 'over-budget'
export type WidgetSize = 'sm' | 'md' | 'lg' | 'full'

export interface WidgetDefinition {
  /** Unique id scoped to the module, e.g. 'expense-distribution' */
  id: string
  /** Owning module id — filled automatically by the registry */
  moduleId?: string
  /** i18n key for the widget title */
  titleKey: string
  /** Fallback title when i18n key is missing */
  fallbackTitle: string
  /** Optional description for the configurator UI */
  descriptionKey?: string
  fallbackDescription?: string
  /** Lazy component loader */
  component: () => Promise<{ default: ComponentType }>
  /** Whether the widget is visible by default (default: true) */
  defaultVisible?: boolean
  /** Default ordering hint — lower numbers appear first */
  defaultOrder?: number
  /** Layout size hint */
  size?: WidgetSize
}

export interface AppModuleRouteDefinition {
  path: string
  kind: AppModuleRouteKind
}

export interface AppModuleNavigationItem {
  id: string
  titleKey: string
  fallbackTitle: string
  icon: Icon
  to?: string
  action?: ModuleActionId
  badgeId?: ModuleBadgeId
  order?: number
}

export interface AppModuleNavigationSection {
  id: string
  title: string
  kind: ModuleNavigationKind
  order: number
  items: AppModuleNavigationItem[]
}

export interface AppModuleManifest {
  id: string
  title: string
  description: string
  enabledByDefault?: boolean
  dependencies?: string[]
  tags?: string[]
  legacyFeatureKeys?: string[]
  routes: AppModuleRouteDefinition[]
  navigation?: AppModuleNavigationSection[]
  widgets?: WidgetDefinition[]
}

export interface SidebarRuntimeItem {
  title: string
  url?: string
  icon: Icon
  onClick?: () => void
  badge?: ReactNode
}

export interface SidebarRuntimeSection {
  title: string
  order: number
  items: SidebarRuntimeItem[]
}
