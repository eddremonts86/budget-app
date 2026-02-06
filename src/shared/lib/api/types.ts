export interface ApiError {
  message: string
  code?: string
  errors?: Record<string, string[]>
  statusCode?: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
  meta?: {
    page: number
    total: number
    perPage: number
    totalPages: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    total: number
    perPage: number
    totalPages: number
  }
}
