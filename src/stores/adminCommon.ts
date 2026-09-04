import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminCommonApi } from '../services/adminCommonApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { Inquiry, InquiryCreateRequest, Notification } from '../types/adminCommon'

export const useAdminCommonStore = defineStore('adminCommon', () => {
  const authStore = useAuthStore()
  const inquiries = ref<Inquiry[]>([])
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const fieldErrors = ref<Record<string, string>>({})

  async function authorized<T>(request: (token: string) => Promise<T>) {
    try {
      return await request(await authStore.getValidAccessToken())
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      return request(await authStore.refreshAccessToken())
    }
  }

  function fail(cause: unknown, fallback: string) {
    error.value = cause instanceof Error ? cause.message : fallback
    fieldErrors.value = cause instanceof ApiError ? cause.fieldErrors : {}
  }

  async function fetchInquiries() {
    loading.value = true
    error.value = ''
    try {
      inquiries.value = await authorized((token) => adminCommonApi.inquiries(token))
      return inquiries.value
    } catch (cause) {
      fail(cause, '문의 목록을 불러오지 못했습니다.')
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function createInquiry(body: InquiryCreateRequest) {
    saving.value = true
    error.value = ''
    fieldErrors.value = {}
    try {
      const created = await authorized((token) => adminCommonApi.createInquiry(token, body))
      inquiries.value.unshift(created)
      return created
    } catch (cause) {
      fail(cause, '문의를 등록하지 못했습니다.')
      throw cause
    } finally {
      saving.value = false
    }
  }

  async function fetchNotifications() {
    loading.value = true
    error.value = ''
    try {
      notifications.value = await authorized((token) => adminCommonApi.notifications(token))
      return notifications.value
    } catch (cause) {
      fail(cause, '알림 목록을 불러오지 못했습니다.')
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function readNotification(seq: number) {
    error.value = ''
    try {
      const updated = await authorized((token) => adminCommonApi.readNotification(token, seq))
      const index = notifications.value.findIndex((item) => item.seq === seq)
      if (index >= 0) notifications.value[index] = updated
      return updated
    } catch (cause) {
      fail(cause, '알림을 읽음 처리하지 못했습니다.')
      throw cause
    }
  }

  return {
    inquiries,
    notifications,
    loading,
    saving,
    error,
    fieldErrors,
    fetchInquiries,
    createInquiry,
    fetchNotifications,
    readNotification,
  }
})
