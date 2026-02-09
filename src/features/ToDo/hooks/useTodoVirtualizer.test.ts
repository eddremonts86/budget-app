import { describe, it, expect } from 'vitest'
import { shouldFetchNextPage } from './useTodoVirtualizer'

describe('shouldFetchNextPage', () => {
  it('returns true when near the end and can fetch', () => {
    expect(
      shouldFetchNextPage({
        hasNextPage: true,
        isFetchingNextPage: false,
        totalRows: 10,
        virtualItems: [{ index: 7 }],
      }),
    ).toBe(true)
  })

  it('returns false when there is no next page', () => {
    expect(
      shouldFetchNextPage({
        hasNextPage: false,
        isFetchingNextPage: false,
        totalRows: 10,
        virtualItems: [{ index: 7 }],
      }),
    ).toBe(false)
  })

  it('returns false when already fetching', () => {
    expect(
      shouldFetchNextPage({
        hasNextPage: true,
        isFetchingNextPage: true,
        totalRows: 10,
        virtualItems: [{ index: 7 }],
      }),
    ).toBe(false)
  })

  it('returns false when there are no virtual items', () => {
    expect(
      shouldFetchNextPage({
        hasNextPage: true,
        isFetchingNextPage: false,
        totalRows: 10,
        virtualItems: [],
      }),
    ).toBe(false)
  })
})
