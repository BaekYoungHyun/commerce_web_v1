import type { Cart, CartItemAddRequest, CartItemUpdateRequest } from '../types/cart'
import { apiRequest } from './httpClient'

const bearerHeaders = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })

export const cartApi = {
  list(accessToken: string) {
    return apiRequest<Cart>('/carts', {
      headers: bearerHeaders(accessToken),
    })
  },

  add(accessToken: string, payload: CartItemAddRequest) {
    return apiRequest<Cart>('/carts', {
      method: 'POST',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify(payload),
    })
  },

  updateQuantity(accessToken: string, cartSeq: number, payload: CartItemUpdateRequest) {
    return apiRequest<Cart>(`/carts/${cartSeq}`, {
      method: 'PUT',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify(payload),
    })
  },

  remove(accessToken: string, cartSeq: number) {
    return apiRequest<void>(`/carts/${cartSeq}`, {
      method: 'DELETE',
      headers: bearerHeaders(accessToken),
    })
  },
}
