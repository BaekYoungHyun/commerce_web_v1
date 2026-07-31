import type { Cart, CartItem, CartItemAddRequest, CartItemUpdateRequest } from '../types/cart'
import { apiRequest } from './httpClient'

const bearerHeaders = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })
const cartItemsPath = (cartSeq: number) => `/carts/${cartSeq}/items`

export const cartApi = {
  list(accessToken: string, cartSeq: number) {
    return apiRequest<Cart>(cartItemsPath(cartSeq), {
      headers: bearerHeaders(accessToken),
    })
  },

  add(accessToken: string, cartSeq: number, payload: CartItemAddRequest) {
    return apiRequest<CartItem>(cartItemsPath(cartSeq), {
      method: 'POST',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify(payload),
    })
  },

  updateQuantity(
    accessToken: string,
    cartSeq: number,
    cartItemSeq: number,
    payload: CartItemUpdateRequest,
  ) {
    return apiRequest<CartItem>(`${cartItemsPath(cartSeq)}/${cartItemSeq}`, {
      method: 'PUT',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify(payload),
    })
  },

  remove(accessToken: string, cartSeq: number, cartItemSeq: number) {
    return apiRequest<void>(`${cartItemsPath(cartSeq)}/${cartItemSeq}`, {
      method: 'DELETE',
      headers: bearerHeaders(accessToken),
    })
  },
}
