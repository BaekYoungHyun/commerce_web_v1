import { apiRequest } from './httpClient'
import type { AdminUser, AdminUserCreateRequest, AdminUserUpdateRequest } from '../types/adminUser'
import type { PageQuery, PageResponse } from '../types/page'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })
export interface AdminUserListQuery extends PageQuery { keyword?: string; status?: string; businessType?: string }
const query = (filters: AdminUserListQuery = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  return params.size ? `?${params.toString()}` : ''
}

export const adminUserApi = {
  list(token: string, filters: AdminUserListQuery = {}) {
    return apiRequest<PageResponse<AdminUser>>(`/admin/users${query(filters)}`, { headers: headers(token) })
  },
  create(token: string, body: AdminUserCreateRequest) {
    return apiRequest<AdminUser>('/admin/users', {
      method: 'POST', headers: headers(token), body: JSON.stringify(body),
    })
  },
  update(token: string, seq: number, body: AdminUserUpdateRequest) {
    return apiRequest<AdminUser>(`/admin/users/${seq}`, {
      method: 'PUT', headers: headers(token), body: JSON.stringify(body),
    })
  },
}
