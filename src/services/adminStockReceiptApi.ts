import { apiRequest } from './httpClient'
import type { AdminStockReceipt, AdminStockReceiptCreateRequest, AdminStockReceiptUpdateRequest } from '../types/adminStockReceipt'
import type { PageQuery, PageResponse } from '../types/page'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })

export const adminStockReceiptApi = {
  list(token: string, filters: PageQuery & { status?: string } = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
    return apiRequest<PageResponse<AdminStockReceipt>>(`/wholesale/stock-receipts${params.size ? `?${params}` : ''}`, { headers: headers(token) })
  },
  create(token: string, body: AdminStockReceiptCreateRequest) {
    return apiRequest<AdminStockReceipt>('/wholesale/stock-receipts', {
      method: 'POST', headers: headers(token), body: JSON.stringify(body),
    })
  },
  update(token: string, seq: number, body: AdminStockReceiptUpdateRequest) {
    return apiRequest<AdminStockReceipt>(`/wholesale/stock-receipts/${seq}`, {
      method: 'PUT', headers: headers(token), body: JSON.stringify(body),
    })
  },
}
