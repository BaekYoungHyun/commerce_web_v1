import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminStockReceiptApi } from '../services/adminStockReceiptApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { AdminStockReceiptCreateRequest, AdminStockReceiptUpdateRequest } from '../types/adminStockReceipt'
import type { AdminStockReceipt } from '../types/adminStockReceipt'
import type { PageQuery } from '../types/page'
import { emptyPage } from '../types/page'

export const useAdminStockReceiptsStore = defineStore('adminStockReceipts', () => {
  const authStore = useAuthStore()
  const receipts = ref<AdminStockReceipt[]>([])
  const pagination = ref(emptyPage<AdminStockReceipt>())
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const fieldErrors = ref<Record<string, string>>({})
  async function authorized<T>(request: (token: string) => Promise<T>) {
    try { return await request(await authStore.getValidAccessToken()) }
    catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      return request(await authStore.refreshAccessToken())
    }
  }
  function fail(cause: unknown, fallback: string) {
    error.value = cause instanceof Error ? cause.message : fallback
    fieldErrors.value = cause instanceof ApiError ? cause.fieldErrors : {}
  }
  async function fetchReceipts(filters: PageQuery & { status?: string } = {}) {
    loading.value = true; error.value = ''
    try {
      const response = await authorized((token) => adminStockReceiptApi.list(token, filters))
      pagination.value = response
      receipts.value = response.content
      return receipts.value
    }
    catch (cause) { fail(cause, '입고 목록을 불러오지 못했습니다.'); throw cause }
    finally { loading.value = false }
  }
  async function saveReceipt(body: AdminStockReceiptCreateRequest | AdminStockReceiptUpdateRequest, seq?: number) {
    saving.value = true; error.value = ''; fieldErrors.value = {}
    try {
      const saved = await authorized((token) => seq
        ? adminStockReceiptApi.update(token, seq, body as AdminStockReceiptUpdateRequest)
        : adminStockReceiptApi.create(token, body as AdminStockReceiptCreateRequest))
      if (seq) {
        const index = receipts.value.findIndex((item) => item.seq === seq)
        if (index >= 0) receipts.value[index] = saved
      } else receipts.value.unshift(saved)
      return saved
    } catch (cause) { fail(cause, seq ? '입고를 수정하지 못했습니다.' : '입고를 등록하지 못했습니다.'); throw cause }
    finally { saving.value = false }
  }
  return { receipts, pagination, loading, saving, error, fieldErrors, fetchReceipts, saveReceipt }
})
