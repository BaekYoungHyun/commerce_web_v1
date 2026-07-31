import { apiRequest } from './httpClient'
import type {
  AdminProduct,
  AdminProductCreateRequest,
  AdminProductListParams,
  AdminProductPage,
  AdminProductUpdateRequest,
  ProductView,
  ProductViewCreateRequest,
} from '../types/adminProduct'

const bearerHeaders = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })

const toQuery = (params: AdminProductListParams) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  return query.toString()
}

export const productApi = {
  list(accessToken: string, params: AdminProductListParams = {}) {
    const query = toQuery(params)
    return apiRequest<AdminProductPage>(`/products${query ? `?${query}` : ''}`, {
      headers: bearerHeaders(accessToken),
    })
  },

  detail(accessToken: string, productId: number) {
    return apiRequest<AdminProduct>(`/products/${productId}`, {
      headers: bearerHeaders(accessToken),
    })
  },

  createView(accessToken: string, productId: number, payload: ProductViewCreateRequest) {
    return apiRequest<ProductView>(`/products/${productId}/views`, {
      method: 'POST',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify(payload),
    })
  },

  create(accessToken: string, payload: AdminProductCreateRequest) {
    return apiRequest<AdminProduct>('/products', {
      method: 'POST',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify(payload),
    })
  },

  update(accessToken: string, productId: number, payload: AdminProductUpdateRequest) {
    return apiRequest<AdminProduct>(`/products/${productId}`, {
      method: 'PUT',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify(payload),
    })
  },
}
