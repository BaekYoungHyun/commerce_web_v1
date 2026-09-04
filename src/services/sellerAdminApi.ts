import { apiRequest } from './httpClient'
import type {
  RefundRequest,
  SellerAddress,
  SellerAddressRequest,
  SellerBusinessResponse,
  SellerDashboard,
  SellerPayment,
  SellerWishlist,
  WishlistRequest,
} from '../types/sellerAdmin'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })
export const sellerAdminApi = {
  dashboard: (token: string) =>
    apiRequest<SellerDashboard>('/seller/dashboard', { headers: headers(token) }),
  addresses: (token: string) =>
    apiRequest<SellerAddress[]>('/seller/addresses', { headers: headers(token) }),
  createAddress: (token: string, body: SellerAddressRequest) =>
    apiRequest<SellerAddress>('/seller/addresses', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    }),
  updateAddress: (token: string, seq: number, body: SellerAddressRequest) =>
    apiRequest<SellerAddress>(`/seller/addresses/${seq}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(body),
    }),
  deleteAddress: (token: string, seq: number) =>
    apiRequest<void>(`/seller/addresses/${seq}`, { method: 'DELETE', headers: headers(token) }),
  payments: (token: string) =>
    apiRequest<SellerPayment[]>('/seller/payments', { headers: headers(token) }),
  requestRefund: (token: string, body: RefundRequest) =>
    apiRequest<unknown>('/seller/refunds', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    }),
  wishlists: (token: string) =>
    apiRequest<SellerWishlist[]>('/seller/wishlists', { headers: headers(token) }),
  addWishlist: (token: string, body: WishlistRequest) =>
    apiRequest<SellerWishlist>('/seller/wishlists', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    }),
  deleteWishlist: (token: string, seq: number) =>
    apiRequest<void>(`/seller/wishlists/${seq}`, { method: 'DELETE', headers: headers(token) }),
  business: (token: string) =>
    apiRequest<SellerBusinessResponse>('/seller/business', { headers: headers(token) }),
}
