import { apiRequest } from './httpClient'
import type { AdminInventory, AdminInventoryBulkRequest, AdminInventoryRequest } from '../types/adminInventory'
import type { PageQuery, PageResponse } from '../types/page'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })

export const adminInventoryApi = {
  list(token: string, filters: PageQuery = {}) {
    const params = new URLSearchParams()
    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.size !== undefined) params.set('size', String(filters.size))
    return apiRequest<PageResponse<AdminInventory>>(`/wholesale/inventory${params.size ? `?${params}` : ''}`, { headers: headers(token) })
  },
  create(token: string, body: AdminInventoryRequest) {
    return apiRequest<AdminInventory>('/wholesale/inventory', { method: 'POST', headers: headers(token), body: JSON.stringify(body) })
  },
  update(token: string, seq: number, body: AdminInventoryRequest) {
    return apiRequest<AdminInventory>(`/wholesale/inventory/${seq}`, { method: 'PUT', headers: headers(token), body: JSON.stringify(body) })
  },
  bulkUpsert(token: string, body: AdminInventoryBulkRequest) {
    return apiRequest<AdminInventory[]>('/wholesale/inventory/bulk', { method: 'POST', headers: headers(token), body: JSON.stringify(body) })
  },
}
