import { apiRequest } from './httpClient'
import type { ApiCategory } from '../types/category'

export const categoryApi = {
  list(accessToken: string, activeOnly = true) {
    return apiRequest<ApiCategory[]>(`/categories?activeOnly=${activeOnly}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  },
}
