export const cacheProfiles = {
  /**
   * Datos que cambian frecuentemente (real-time updates)
   * staleTime: 0, gcTime: 5 min
   */
  realtime: {
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  },

  /**
   * Datos estándar - default para la mayoría de casos
   * staleTime: 5 min, gcTime: 30 min
   */
  standard: {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },

  /**
   * Datos que cambian poco frecuentemente
   * staleTime: 30 min, gcTime: 1 hour
   */
  stable: {
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  },

  /**
   * Datos casi estáticos (configuraciones, enums, etc.)
   * staleTime: Infinity, gcTime: Infinity
   */
  static: {
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  },
} as const

export type CacheProfile = keyof typeof cacheProfiles
