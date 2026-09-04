import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminDeliveryCompanyApi } from '../services/adminDeliveryCompanyApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type {
  AdminDeliveryCompanyCreateRequest,
  AdminDeliveryCompanyUpdateRequest,
} from '../types/adminDeliveryCompany'
import type { AdminDeliveryCompany } from '../types/adminDeliveryCompany'
import type { PageQuery } from '../types/page'
import { emptyPage } from '../types/page'

export const useAdminDeliveryCompaniesStore = defineStore('adminDeliveryCompanies', () => {
  const authStore = useAuthStore()
  const companies = ref<AdminDeliveryCompany[]>([])
  const pagination = ref(emptyPage<AdminDeliveryCompany>())
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

  async function fetchCompanies(filters: PageQuery & { keyword?: string; active?: boolean } = {}) {
    loading.value = true
    error.value = ''
    try {
      const response = await authorized((token) => adminDeliveryCompanyApi.list(token, filters))
      pagination.value = response
      companies.value = response.content
      return companies.value
    } catch (cause) {
      fail(cause, '택배사 목록을 불러오지 못했습니다.')
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function saveCompany(
    body: AdminDeliveryCompanyCreateRequest | AdminDeliveryCompanyUpdateRequest,
    code?: string,
  ) {
    saving.value = true
    error.value = ''
    fieldErrors.value = {}
    try {
      return await authorized((token) =>
        code
          ? adminDeliveryCompanyApi.update(token, code, body as AdminDeliveryCompanyUpdateRequest)
          : adminDeliveryCompanyApi.create(token, body as AdminDeliveryCompanyCreateRequest),
      )
    } catch (cause) {
      fail(cause, code ? '택배사를 수정하지 못했습니다.' : '택배사를 등록하지 못했습니다.')
      throw cause
    } finally {
      saving.value = false
    }
  }

  return { companies, pagination, loading, saving, error, fieldErrors, fetchCompanies, saveCompany }
})
