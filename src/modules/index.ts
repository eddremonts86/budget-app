export { getExplicitlyDisabledModuleIds, getExplicitlyEnabledModuleIds } from './core/config'
export { getDashboardPageTitle, getSidebarNavigation } from './core/navigation'
export { getEnabledModules, getModuleById, getModuleByRoute, moduleRegistry } from './core/registry'
export type {
  AppModuleManifest,
  AppModuleNavigationItem,
  AppModuleNavigationSection,
  AppModuleRouteDefinition,
  ModuleActionId,
  ModuleBadgeId,
} from './core/types'
