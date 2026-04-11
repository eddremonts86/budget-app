/**
 * Flatten + deduplicate pages from an infinite query.
 * Works with any entity that has a string `id` field.
 */
export function flattenInfinitePages<T extends { id: string }>(
  pages: Array<{ data: unknown[] }> | undefined,
): T[] {
  if (!pages) return []
  const seen = new Set<string>()
  const result: T[] = []
  for (const page of pages) {
    for (const item of page.data as T[]) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        result.push(item)
      }
    }
  }
  return result
}
