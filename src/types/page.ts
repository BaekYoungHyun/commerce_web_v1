export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PageQuery {
  page?: number
  size?: number
}

export const emptyPage = <T>(): PageResponse<T> => ({
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
})
