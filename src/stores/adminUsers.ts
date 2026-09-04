import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminUserApi } from '../services/adminUserApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { AdminUserCreateRequest, AdminUserUpdateRequest } from '../types/adminUser'
import type { AdminUserListQuery } from '../services/adminUserApi'
import type { AdminUser } from '../types/adminUser'
import { emptyPage } from '../types/page'

export const useAdminUsersStore = defineStore('adminUsers', () => {
  const authStore = useAuthStore()
  const users = ref<AdminUser[]>([])
  const pagination = ref(emptyPage<AdminUser>())
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

  function applyError(cause: unknown, fallback: string) {
    error.value = cause instanceof Error ? cause.message : fallback
    fieldErrors.value = cause instanceof ApiError ? cause.fieldErrors : {}
  }

  async function fetchUsers(filters: AdminUserListQuery = {}) {
    loading.value = true
    error.value = ''
    try {
      const response = await authorized((token) => adminUserApi.list(token, filters))
      pagination.value = response
      users.value = response.content
      return users.value
    }
    catch (cause) { applyError(cause, '사용자 목록을 불러오지 못했습니다.'); throw cause }
    finally { loading.value = false }
  }

  async function saveUser(body: AdminUserCreateRequest | AdminUserUpdateRequest, seq?: number) {
    saving.value = true
    error.value = ''
    fieldErrors.value = {}
    try {
      return await authorized((token) => seq
        ? adminUserApi.update(token, seq, body as AdminUserUpdateRequest)
        : adminUserApi.create(token, body as AdminUserCreateRequest))
    } catch (cause) { applyError(cause, seq ? '사용자를 수정하지 못했습니다.' : '사용자를 등록하지 못했습니다.'); throw cause }
    finally { saving.value = false }
  }

  return { users, pagination, loading, saving, error, fieldErrors, fetchUsers, saveUser }
})
