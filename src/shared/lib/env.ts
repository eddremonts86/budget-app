/**
 * Runtime environment constants derived from env vars.
 * Evaluated once at module load — safe because env vars don't change at runtime.
 */
export const isE2E = process.env.VITE_E2E === 'true'
