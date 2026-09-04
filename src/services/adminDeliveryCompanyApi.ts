import { apiRequest } from './httpClient'
import type {
  AdminDeliveryCompany,
  AdminDeliveryCompanyCreateRequest,
  AdminDeliveryCompanyUpdateRequest,
} from '../types/adminDeliveryCompany'
import type { PageQuery, PageResponse } from '../types/page'

const headers = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })

export const adminDeliveryCompanyApi = {
  list(accessToken: string, filters: PageQuery & { keyword?: string; active?: boolean } = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
    return apiRequest<PageResponse<AdminDeliveryCompany>>(`/admin/delivery-companies${params.size ? `?${params}` : ''}`, {
      headers: headers(accessToken),
    })
  },
  create(accessToken: string, body: AdminDeliveryCompanyCreateRequest) {
    return apiRequest<AdminDeliveryCompany>('/admin/delivery-companies', {
      method: 'POST',
      headers: headers(accessToken),
      body: JSON.stringify(body),
    })
  },
  update(accessToken: string, code: string, body: AdminDeliveryCompanyUpdateRequest) {
    return apiRequest<AdminDeliveryCompany>(
      `/admin/delivery-companies/${encodeURIComponent(code)}`,
      { method: 'PUT', headers: headers(accessToken), body: JSON.stringify(body) },
    )
  },
}
