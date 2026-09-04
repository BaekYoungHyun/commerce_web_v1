import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminInventoryApi } from '../services/adminInventoryApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { AdminInventoryBulkRequest, AdminInventoryRequest } from '../types/adminInventory'
import type { AdminInventory } from '../types/adminInventory'
import type { PageQuery } from '../types/page'
import { emptyPage } from '../types/page'

export const useAdminInventoryStore = defineStore('adminInventory', () => {
  const authStore = useAuthStore()
  const inventory = ref<AdminInventory[]>([])
  const pagination = ref(emptyPage<AdminInventory>())
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
  async function fetchInventory(filters: PageQuery = {}) {
    loading.value = true; error.value = ''
    try {
      const response = await authorized((token) => adminInventoryApi.list(token, filters))
      pagination.value = response
      inventory.value = response.content
      return inventory.value
    }
    catch (cause) { fail(cause, '재고 목록을 불러오지 못했습니다.'); throw cause }
    finally { loading.value = false }
  }
  async function saveInventory(body: AdminInventoryRequest, seq?: number) {
    saving.value = true; error.value = ''; fieldErrors.value = {}
    try { return await authorized((token) => seq ? adminInventoryApi.update(token, seq, body) : adminInventoryApi.create(token, body)) }
    catch (cause) { fail(cause, seq ? '재고를 수정하지 못했습니다.' : '재고를 등록하지 못했습니다.'); throw cause }
    finally { saving.value = false }
  }
  async function bulkUpsert(body: AdminInventoryBulkRequest) {
    saving.value = true; error.value = ''; fieldErrors.value = {}
    try { inventory.value = await authorized((token) => adminInventoryApi.bulkUpsert(token, body)); return inventory.value }
    catch (cause) { fail(cause, '재고를 일괄 저장하지 못했습니다.'); throw cause }
    finally { saving.value = false }
  }
  return { inventory, pagination, loading, saving, error, fieldErrors, fetchInventory, saveInventory, bulkUpsert }
})
