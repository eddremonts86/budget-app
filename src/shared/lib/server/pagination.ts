export interface JsonServerResponse<T> {
  data: T[]
  items: number
  next: number | null
  prev: number | null
  first: number
  last: number
  pages: number
}

export interface PaginationParams {
  page: number
  perPage: number
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
}

export function parsePaginationParams(url: URL): PaginationParams {
  const page = parseInt(url.searchParams.get('_page') || '1', 10)
  const perPage = parseInt(url.searchParams.get('_per_page') || '10', 10)
  const sortParam = url.searchParams.get('_sort')

  let sort: PaginationParams['sort']
  if (sortParam) {
    const order = sortParam.startsWith('-') ? 'desc' : 'asc'
    const field = sortParam.replace(/^-/, '')
    sort = { field, order }
  }

  return { page, perPage, sort }
}

export function buildPaginationResponse<T>(
  data: T[],
  totalItems: number,
  page: number,
  perPage: number,
): JsonServerResponse<T> {
  const totalPages = Math.ceil(totalItems / perPage)

  return {
    data,
    items: totalItems,
    first: 1,
    last: totalPages,
    prev: page > 1 ? page - 1 : null,
    next: page < totalPages ? page + 1 : null,
    pages: totalPages,
  }
}
