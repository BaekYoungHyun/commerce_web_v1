import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '../services/authApi'
import { ApiError } from '../services/httpClient'
import type { LoginRequest, SignUpRequest, User } from '../types/auth'

const ACCESS_TOKEN_KEY = 'commerce.accessToken'
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'commerce.accessTokenExpiresAt'

function readSessionToken() {
  if (typeof sessionStorage === 'undefined') return { token: null, expiresAt: null }
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  const storedExpiresAt = Number(sessionStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY))
  return { token, expiresAt: Number.isFinite(storedExpiresAt) && storedExpiresAt > 0 ? storedExpiresAt : null }
}

export const useAuthStore = defineStore('auth', () => {
  const sessionToken = readSessionToken()
  const accessToken = ref<string | null>(sessionToken.token)
  const accessTokenExpiresAt = ref<number | null>(sessionToken.expiresAt)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')
  let refreshPromise: Promise<string> | null = null

  const isAuthenticated = computed(
    () =>
      Boolean(accessToken.value),
  )

  function clear() {
    accessToken.value = null
    accessTokenExpiresAt.value = null
    user.value = null
    error.value = ''
    refreshPromise = null
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY)
      sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
    }
  }

  function applyToken(token: string, expiresAt: number) {
    accessToken.value = token
    accessTokenExpiresAt.value = expiresAt
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
      sessionStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt))
    }
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

  async function getValidAccessToken() {
    if (!accessToken.value) throw new ApiError(401, '로그인이 필요합니다.')
    const expiresAt = accessTokenExpiresAt.value
    if (expiresAt !== null && expiresAt <= Date.now() + 10_000) return refreshAccessToken()
    return accessToken.value
  }

  async function fetchCurrentUser() {
    if (!accessToken.value) return null
    try {
      user.value = await authApi.getCurrentUser(await getValidAccessToken())
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
    getValidAccessToken,
    logout,
    clear,
  }
})
