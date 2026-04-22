/**
 * Dynamic import helper for the database connection.
 * Used in server functions to avoid bundling the DB driver into the client build.
 */
export async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}
