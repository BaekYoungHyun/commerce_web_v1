import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminInquiryApi } from '../services/adminInquiryApi'
import type { AdminInquiryListQuery } from '../services/adminInquiryApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import { emptyPage } from '../types/page'
import type { AdminInquiry, InquiryStatus } from '../types/adminInquiry'

export const useAdminInquiriesStore = defineStore('adminInquiries', () => {
  const authStore = useAuthStore()
  const inquiries = ref<AdminInquiry[]>([])
  const pagination = ref(emptyPage<AdminInquiry>())
  const loading = ref(false)
  const savingSeq = ref<number | null>(null)
  const error = ref('')

  async function authorized<T>(request: (token: string) => Promise<T>) {
    try {
      return await request(await authStore.getValidAccessToken())
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      return request(await authStore.refreshAccessToken())
    }
  }

  function applyError(cause: unknown, fallback: string) {
    error.value = cause instanceof Error ? cause.message : fallback
  }

  async function fetchInquiries(filters: AdminInquiryListQuery = {}) {
    loading.value = true
    error.value = ''
    try {
      const response = await authorized((token) => adminInquiryApi.list(token, filters))
      pagination.value = response
      inquiries.value = response.content
    } catch (cause) {
      applyError(cause, '전체 문의 목록을 불러오지 못했습니다.')
      throw cause
    } finally {
      loading.value = false
    }
  }

  function replaceInquiry(updated: AdminInquiry) {
    inquiries.value = inquiries.value.map((item) => (item.seq === updated.seq ? updated : item))
  }

  async function saveAnswer(inquirySeq: number, content: string) {
    savingSeq.value = inquirySeq
    error.value = ''
    try {
      const updated = await authorized((token) =>
        adminInquiryApi.answer(token, inquirySeq, { content }),
      )
      replaceInquiry(updated)
    } catch (cause) {
      applyError(cause, '답변을 저장하지 못했습니다.')
      throw cause
    } finally {
      savingSeq.value = null
    }
  }

  async function changeStatus(inquirySeq: number, status: InquiryStatus) {
    savingSeq.value = inquirySeq
    error.value = ''
    try {
      const updated = await authorized((token) =>
        adminInquiryApi.updateStatus(token, inquirySeq, status),
      )
      replaceInquiry(updated)
    } catch (cause) {
      applyError(cause, '문의 상태를 변경하지 못했습니다.')
      throw cause
    } finally {
      savingSeq.value = null
    }
  }

  return {
    inquiries,
    pagination,
    loading,
    savingSeq,
    error,
    fetchInquiries,
    saveAnswer,
    changeStatus,
  }
})
