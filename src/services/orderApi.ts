import { apiRequest } from './httpClient'
import type { CartOrderCreateRequest, Order } from '../types/order'
import type { PageQuery, PageResponse } from '../types/page'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })
export interface OrderListQuery extends PageQuery {
  status?: string
}
const query = (filters: OrderListQuery = {}) => {
  const params = new URLSearchParams()
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.size !== undefined) params.set('size', String(filters.size))
  if (filters.status) params.set('status', filters.status)
  return params.size ? `?${params.toString()}` : ''
}

export const orderApi = {
  createFromCart(token: string, body: CartOrderCreateRequest) {
    return apiRequest<Order[]>('/orders/from-cart', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    })
  },
  myOrders(token: string, filters: OrderListQuery = {}) {
    return apiRequest<PageResponse<Order>>(`/orders${query(filters)}`, { headers: headers(token) })
  },
  myOrder(token: string, seq: number) {
    return apiRequest<Order>(`/orders/${seq}`, { headers: headers(token) })
  },
  adminOrders(token: string, filters: OrderListQuery = {}) {
    return apiRequest<PageResponse<Order>>(`/admin/orders${query(filters)}`, {
      headers: headers(token),
    })
  },
}
