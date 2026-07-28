import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '../services/authApi'
import { ApiError } from '../services/httpClient'
import type { LoginRequest, SignUpRequest, User } from '../types/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const accessTokenExpiresAt = ref<number | null>(null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')
  let refreshPromise: Promise<string> | null = null

  const isAuthenticated = computed(
    () =>
      Boolean(accessToken.value) &&
      (accessTokenExpiresAt.value === null || accessTokenExpiresAt.value > Date.now()),
  )

  function clear() {
    accessToken.value = null
    accessTokenExpiresAt.value = null
    user.value = null
    error.value = ''
    refreshPromise = null
  }

  function applyToken(token: string, expiresAt: number) {
    accessToken.value = token
    accessTokenExpiresAt.value = expiresAt
  }

  async function signUp(payload: SignUpRequest) {
    loading.value = true
    error.value = ''
    try {
      return await authApi.signUp(payload)
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '회원가입에 실패했습니다.'
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function login(payload: LoginRequest) {
    loading.value = true
    error.value = ''
    try {
      const response = await authApi.login(payload)
      applyToken(response.accessToken, response.accessTokenExpiresIn)
      return response
    } catch (cause) {
      clear()
      error.value = cause instanceof Error ? cause.message : '로그인에 실패했습니다.'
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function refreshAccessToken() {
    if (!accessToken.value) throw new Error('로그인이 필요합니다.')
    if (refreshPromise) return refreshPromise

    const previousToken = accessToken.value
    refreshPromise = authApi
      .refreshToken(previousToken)
      .then((response) => {
        applyToken(response.accessToken, response.accessTokenExpiresIn)
        return response.accessToken
      })
      .catch((cause) => {
        clear()
        throw cause
      })
      .finally(() => {
        refreshPromise = null
      })
    return refreshPromise
  }

  async function fetchCurrentUser() {
    if (!accessToken.value) return null
    try {
      user.value = await authApi.getCurrentUser(accessToken.value)
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      const refreshedToken = await refreshAccessToken()
      user.value = await authApi.getCurrentUser(refreshedToken)
    }
    return user.value
  }

  async function logout() {
    const token = accessToken.value
    try {
      if (token) await authApi.logout(token)
    } finally {
      clear()
    }
  }

  return {
    accessToken,
    accessTokenExpiresAt,
    user,
    loading,
    error,
    isAuthenticated,
    signUp,
    login,
    fetchCurrentUser,
    refreshAccessToken,
    logout,
    clear,
  }
})
