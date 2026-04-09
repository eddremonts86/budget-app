import { promises as fs } from 'node:fs'
import path from 'node:path'

type UiRoute = {
  path: string
  module: string
  authRequired: boolean
  nestedUnder: string | null
  params: string[]
  redirectTo?: string
}

type ApiRoute = {
  path: string
  module: string
  methods: string[]
  params: string[]
}

type Inventory = {
  metadata: {
    generatedAt: string
    source: string[]
    notes: string
  }
  uiRoutes: UiRoute[]
  apiRoutes: ApiRoute[]
}

const workspaceRoot = process.cwd()
const routeTreePath = path.join(workspaceRoot, 'src', 'routeTree.gen.ts')
const routesDir = path.join(workspaceRoot, 'src', 'routes')
const outputYaml = path.join(workspaceRoot, 'docs', 'testing', 'routes-inventory.yaml')

const toTitleModule = (routePath: string) => {
  const segment = routePath.split('/').filter(Boolean).at(-1)

  if (!segment) return 'landing'
  if (segment === 'ia_config') return 'settings-ai'
  return segment.replace(/_/g, '-')
}

const inferNestedUnder = (routePath: string) => {
  if (!routePath.startsWith('/dashboard')) return null
  const parts = routePath.split('/').filter(Boolean)
  if (parts.length <= 1) return '/dashboard'
  if (parts.length === 2) return '/dashboard'
  return `/${parts.slice(0, -1).join('/')}`
}

const extractParams = (routePath: string) =>
  routePath.split('/').filter((segment) => segment.startsWith('$') || segment.startsWith(':'))

const uniqueSorted = (items: string[]) =>
  [...new Set(items)]
    .map((route) => (route.endsWith('/') && route !== '/' ? route.slice(0, -1) : route))
    .sort((a, b) => a.localeCompare(b))

const escapeYamlScalar = (value: string) => {
  if (value === '' || /[:#\-[]{},&*!|>'"%@`]/.test(value) || value.includes(' ')) {
    return JSON.stringify(value)
  }
  return value
}

const yamlValue = (value: unknown, indent = 0): string => {
  const pad = '  '.repeat(indent)

  if (value === null) return 'null'
  if (typeof value === 'string') return escapeYamlScalar(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return value
      .map((entry) => {
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
          const body = Object.entries(entry)
            .map(
              ([key, nested]) =>
                `${'  '.repeat(indent + 1)}${key}: ${yamlValue(nested, indent + 1)}`,
            )
            .join('\n')
          return `${pad}-\n${body}`
        }
        return `${pad}- ${yamlValue(entry, indent + 1)}`
      })
      .join('\n')
  }

  const objectValue = value as Record<string, unknown>
  return Object.entries(objectValue)
    .map(([key, nested]) => {
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        return `${pad}${key}:\n${yamlValue(nested, indent + 1)}`
      }
      if (Array.isArray(nested)) {
        const arr = yamlValue(nested, indent + 1)
        if (arr === '[]') return `${pad}${key}: []`
        return `${pad}${key}:\n${arr}`
      }
      return `${pad}${key}: ${yamlValue(nested, indent + 1)}`
    })
    .join('\n')
}

const extractUiRoutesFromRouteTree = (routeTreeContents: string) => {
  const blockMatch = routeTreeContents.match(/fullPaths:\s*([\s\S]*?)\n\s*fileRoutesByTo:/)
  if (!blockMatch) return [] as string[]

  const paths = Array.from(blockMatch[1].matchAll(/'([^']+)'/g)).map((match) => match[1])
  return uniqueSorted(paths.filter((routePath) => !routePath.startsWith('/api/')))
}

const extractApiRouteData = async () => {
  const entries = await fs.readdir(routesDir)
  const apiFiles = entries.filter((entry) => entry.startsWith('api.') && entry.endsWith('.tsx'))

  const apiRoutes: ApiRoute[] = []

  for (const file of apiFiles) {
    const fullPath = path.join(routesDir, file)
    const content = await fs.readFile(fullPath, 'utf8')

    const pathMatch = content.match(/createFileRoute\('([^']+)'\)/)
    if (!pathMatch) continue

    const methods = Array.from(content.matchAll(/\b(GET|POST|PUT|PATCH|DELETE)\b\s*:/g)).map(
      (m) => m[1],
    )

    apiRoutes.push({
      path: pathMatch[1],
      module: 'ai-api',
      methods: uniqueSorted(methods),
      params: extractParams(pathMatch[1]),
    })
  }

  return apiRoutes.sort((a, b) => a.path.localeCompare(b.path))
}

const buildInventory = async (): Promise<Inventory> => {
  const routeTreeContents = await fs.readFile(routeTreePath, 'utf8')
  const uiRoutePaths = extractUiRoutesFromRouteTree(routeTreeContents)
  const apiRoutes = await extractApiRouteData()

  const uiRoutes: UiRoute[] = uiRoutePaths.map((routePath) => ({
    path: routePath,
    module: toTitleModule(routePath),
    authRequired: routePath.startsWith('/dashboard'),
    nestedUnder: inferNestedUnder(routePath),
    params: extractParams(routePath),
    ...(routePath === '/dashboard/settings' ? { redirectTo: '/dashboard/settings/system' } : {}),
  }))

  return {
    metadata: {
      generatedAt: new Date().toISOString().slice(0, 10),
      source: ['src/routes', 'src/routeTree.gen.ts'],
      notes:
        uiRoutes.some((route) => route.params.length > 0) ||
        apiRoutes.some((route) => route.params.length > 0)
          ? 'Dynamic URL params detected'
          : 'No dynamic URL params were detected in current route tree',
    },
    uiRoutes,
    apiRoutes,
  }
}

const run = async () => {
  const inventory = await buildInventory()

  await fs.mkdir(path.dirname(outputYaml), { recursive: true })
  await fs.writeFile(outputYaml, `${yamlValue(inventory)}\n`, 'utf8')

  console.log('Route inventory updated:')
  console.log(`- ${path.relative(workspaceRoot, outputYaml)}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
