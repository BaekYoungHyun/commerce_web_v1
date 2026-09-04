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

  detail(accessToken: string, productSeq: number) {
    return apiRequest<AdminProduct>(`/products/${productSeq}`, {
      headers: bearerHeaders(accessToken),
    })
  },

  createView(accessToken: string, productSeq: number, payload: ProductViewCreateRequest) {
    return apiRequest<ProductView>(`/products/${productSeq}/views`, {
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

  update(accessToken: string, productSeq: number, payload: AdminProductUpdateRequest) {
    return apiRequest<AdminProduct>(`/products/${productSeq}`, {
      method: 'PUT',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify(payload),
    })
  },
}
