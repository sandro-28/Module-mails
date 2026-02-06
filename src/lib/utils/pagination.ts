export interface PaginationParams {
  page: number
  perPage: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export function getPaginationRange(page: number, perPage: number): { from: number; to: number } {
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  return { from, to }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / perPage)
  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}
