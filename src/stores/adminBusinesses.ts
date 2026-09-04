import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminBusinessApi } from '../services/adminBusinessApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { AdminBusinessItem, AdminBusinessRequest, AdminBusinessResource } from '../types/adminBusiness'
import type { BusinessProfileListQuery, StoreListQuery } from '../services/adminBusinessApi'
import { emptyPage } from '../types/page'

export const useAdminBusinessesStore = defineStore('adminBusinesses', () => {
  const authStore = useAuthStore()
  const items = ref<AdminBusinessItem[]>([])
  const pagination = ref(emptyPage<AdminBusinessItem>())
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

  function applyError(cause: unknown, fallback: string) {
    error.value = cause instanceof Error ? cause.message : fallback
    fieldErrors.value = cause instanceof ApiError ? cause.fieldErrors : {}
  }

  async function fetchItems(resource: AdminBusinessResource, filters: BusinessProfileListQuery | StoreListQuery = {}) {
    loading.value = true
    error.value = ''
    try {
      const response = resource === 'business-profiles'
        ? await authorized((token) => adminBusinessApi.businessProfiles(token, filters as BusinessProfileListQuery))
        : resource === 'wholesale-stores'
          ? await authorized((token) => adminBusinessApi.wholesaleStores(token, filters as StoreListQuery))
          : await authorized((token) => adminBusinessApi.retailStores(token, filters as StoreListQuery))
      pagination.value = response
      items.value = response.content
      return items.value
    } catch (cause) {
      applyError(cause, '목록을 불러오지 못했습니다.')
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function save(resource: AdminBusinessResource, body: AdminBusinessRequest, seq?: number) {
    saving.value = true
    error.value = ''
    fieldErrors.value = {}
    try {
      return await authorized<AdminBusinessItem>((token) => {
        if (resource === 'business-profiles') return seq
          ? adminBusinessApi.updateBusinessProfile(token, seq, body as never)
          : adminBusinessApi.createBusinessProfile(token, body as never)
        if (resource === 'wholesale-stores') return seq
          ? adminBusinessApi.updateWholesaleStore(token, seq, body as never)
          : adminBusinessApi.createWholesaleStore(token, body as never)
        return seq
          ? adminBusinessApi.updateRetailStore(token, seq, body as never)
          : adminBusinessApi.createRetailStore(token, body as never)
      })
    } catch (cause) {
      applyError(cause, seq ? '정보를 수정하지 못했습니다.' : '정보를 등록하지 못했습니다.')
      throw cause
    } finally {
      saving.value = false
    }
  }

  return { items, pagination, loading, saving, error, fieldErrors, fetchItems, save }
})
