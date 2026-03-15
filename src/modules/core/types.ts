import type { Icon } from '@tabler/icons-react'
import type { ReactNode } from 'react'

export type AppModuleRouteKind = 'page' | 'layout' | 'api'
export type ModuleNavigationKind = 'main' | 'secondary'
export type ModuleActionId = 'open-ai-search'
export type ModuleBadgeId = 'pending-transactions'

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
