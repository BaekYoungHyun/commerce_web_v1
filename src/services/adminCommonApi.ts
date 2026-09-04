import { apiRequest } from './httpClient'
import type { Inquiry, InquiryCreateRequest, Notification } from '../types/adminCommon'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })

export const adminCommonApi = {
  inquiries(token: string) {
    return apiRequest<Inquiry[]>('/support/inquiries', { headers: headers(token) })
  },
  createInquiry(token: string, body: InquiryCreateRequest) {
    return apiRequest<Inquiry>('/support/inquiries', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    })
  },
  notifications(token: string) {
    return apiRequest<Notification[]>('/notifications', { headers: headers(token) })
  },
  readNotification(token: string, seq: number) {
    return apiRequest<Notification>(`/notifications/${seq}/read`, {
      method: 'PATCH',
      headers: headers(token),
    })
  },
}
