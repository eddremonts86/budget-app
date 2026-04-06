import { analyticsModule } from '@/modules/analytics/manifest'
import { aiModule } from '@/modules/ai/manifest'
import { budgetsModule } from '@/modules/budgets/manifest'
import { authModule } from '@/modules/auth/manifest'
import { categoriesModule } from '@/modules/categories/manifest'
import { dashboardModule } from '@/modules/dashboard/manifest'
import { helpModule } from '@/modules/help/manifest'
import { landingModule } from '@/modules/landing/manifest'
import { projectsModule } from '@/modules/projects/manifest'
import { settingsModule } from '@/modules/settings/manifest'
import { tasksModule } from '@/modules/tasks/manifest'
import { teamModule } from '@/modules/team/manifest'
import { transactionsModule } from '@/modules/transactions/manifest'
import type { AppModuleManifest } from './types'
import { getExplicitlyDisabledModuleIds, getExplicitlyEnabledModuleIds } from './config'
import { usersModule } from '@/modules/users/manifest'

export const moduleRegistry: AppModuleManifest[] = [
  landingModule,
  authModule,
  dashboardModule,
  aiModule,
  tasksModule,
  categoriesModule,
  projectsModule,
  transactionsModule,
  budgetsModule,
  analyticsModule,
  usersModule,
  teamModule,
  settingsModule,
  helpModule,
]

const moduleMap = new Map(moduleRegistry.map((module) => [module.id, module]))

export function getModuleById(moduleId: string): AppModuleManifest | undefined {
  return moduleMap.get(moduleId)
}

export function getEnabledModules(): AppModuleManifest[] {
  const explicitlyEnabledIds = getExplicitlyEnabledModuleIds()
  const explicitlyDisabledIds = new Set(getExplicitlyDisabledModuleIds())

  const seedModules =
    explicitlyEnabledIds.length > 0
      ? explicitlyEnabledIds
          .map((moduleId) => moduleMap.get(moduleId))
          .filter((module): module is AppModuleManifest => Boolean(module))
      : moduleRegistry.filter((module) => module.enabledByDefault !== false)

  const resolved = new Map<string, AppModuleManifest>()
  const queue = [...seedModules]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || explicitlyDisabledIds.has(current.id) || resolved.has(current.id)) continue

    resolved.set(current.id, current)

    for (const dependencyId of current.dependencies ?? []) {
      const dependency = moduleMap.get(dependencyId)
      if (dependency && !explicitlyDisabledIds.has(dependency.id) && !resolved.has(dependency.id)) {
        queue.push(dependency)
      }
    }
  }

  return moduleRegistry.filter((module) => resolved.has(module.id))
}

export function getModuleByRoute(pathname: string): AppModuleManifest | undefined {
  const routeCandidates = getEnabledModules()
    .flatMap((module) =>
      module.routes
        .filter((route) => route.kind !== 'api')
        .map((route) => ({ module, path: route.path })),
    )
    .filter(({ path }) =>
      path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`),
    )
    .sort((left, right) => right.path.length - left.path.length)

  return routeCandidates[0]?.module
}
