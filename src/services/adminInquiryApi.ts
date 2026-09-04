import { apiRequest } from './httpClient'
import type { PageQuery, PageResponse } from '../types/page'
import type { AdminInquiry, AdminInquiryAnswerRequest, InquiryStatus } from '../types/adminInquiry'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })

export interface AdminInquiryListQuery extends PageQuery {
  keyword?: string
  category?: string
  status?: InquiryStatus
  businessType?: 'WHOLESALE' | 'RETAIL'
}

function query(filters: AdminInquiryListQuery = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  return params.size ? `?${params.toString()}` : ''
}

export const adminInquiryApi = {
  list(token: string, filters: AdminInquiryListQuery = {}) {
    return apiRequest<PageResponse<AdminInquiry>>(`/admin/support/inquiries${query(filters)}`, {
      headers: headers(token),
    })
  },
  answer(token: string, inquirySeq: number, body: AdminInquiryAnswerRequest) {
    return apiRequest<AdminInquiry>(`/admin/support/inquiries/${inquirySeq}/answer`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(body),
    })
  },
  updateStatus(token: string, inquirySeq: number, status: InquiryStatus) {
    return apiRequest<AdminInquiry>(`/admin/support/inquiries/${inquirySeq}/status`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ status }),
    })
  },
}
