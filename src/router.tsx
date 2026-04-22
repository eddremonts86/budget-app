import type {} from '@tanstack/react-start'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })

  return router
}

// Alias for backwards compatibility
export const createRouter = getRouter
