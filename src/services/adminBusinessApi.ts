import { apiRequest } from './httpClient'
import type {
  BusinessProfile,
  BusinessProfileRequest,
  RetailStore,
  RetailStoreRequest,
  WholesaleStore,
  WholesaleStoreRequest,
} from '../types/adminBusiness'
import type { PageQuery, PageResponse } from '../types/page'

const headers = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })
export interface BusinessProfileListQuery extends PageQuery { userSeq?: number; keyword?: string; approvalStatus?: string }
export interface StoreListQuery extends PageQuery { businessProfileSeq?: number; keyword?: string; status?: string }
const filterQuery = (filters: object) => {
  const params = new URLSearchParams()
  Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  return params.size ? `?${params.toString()}` : ''
}

export const adminBusinessApi = {
  businessProfiles(accessToken: string, filters: BusinessProfileListQuery = {}) {
    return apiRequest<PageResponse<BusinessProfile>>(`/admin/business-profiles${filterQuery(filters)}`, { headers: headers(accessToken) })
  },
  createBusinessProfile(accessToken: string, body: BusinessProfileRequest) {
    return apiRequest<BusinessProfile>('/admin/business-profiles', {
      method: 'POST', headers: headers(accessToken), body: JSON.stringify(body),
    })
  },
  updateBusinessProfile(accessToken: string, seq: number, body: BusinessProfileRequest) {
    return apiRequest<BusinessProfile>(`/admin/business-profiles/${seq}`, {
      method: 'PUT', headers: headers(accessToken), body: JSON.stringify(body),
    })
  },
  wholesaleStores(accessToken: string, filters: StoreListQuery = {}) {
    return apiRequest<PageResponse<WholesaleStore>>(`/admin/wholesale-stores${filterQuery(filters)}`, { headers: headers(accessToken) })
  },
  createWholesaleStore(accessToken: string, body: WholesaleStoreRequest) {
    return apiRequest<WholesaleStore>('/admin/wholesale-stores', {
      method: 'POST', headers: headers(accessToken), body: JSON.stringify(body),
    })
  },
  updateWholesaleStore(accessToken: string, seq: number, body: WholesaleStoreRequest) {
    return apiRequest<WholesaleStore>(`/admin/wholesale-stores/${seq}`, {
      method: 'PUT', headers: headers(accessToken), body: JSON.stringify(body),
    })
  },
  retailStores(accessToken: string, filters: StoreListQuery = {}) {
    return apiRequest<PageResponse<RetailStore>>(`/admin/retail-stores${filterQuery(filters)}`, { headers: headers(accessToken) })
  },
  createRetailStore(accessToken: string, body: RetailStoreRequest) {
    return apiRequest<RetailStore>('/admin/retail-stores', {
      method: 'POST', headers: headers(accessToken), body: JSON.stringify(body),
    })
  },
  updateRetailStore(accessToken: string, seq: number, body: RetailStoreRequest) {
    return apiRequest<RetailStore>(`/admin/retail-stores/${seq}`, {
      method: 'PUT', headers: headers(accessToken), body: JSON.stringify(body),
    })
  },
}
