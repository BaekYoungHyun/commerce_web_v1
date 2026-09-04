import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '../services/authApi'
import { ApiError } from '../services/httpClient'
import type { LoginRequest, LoginResponse, SignUpRequest, User } from '../types/auth'
import type { BusinessType } from '../types/userType'
import { userTypeFromBusinessType } from '../types/userType'

const ACCESS_TOKEN_KEY = 'commerce.accessToken'
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'commerce.accessTokenExpiresAt'
const AUTH_CONTEXT_KEY = 'commerce.authContext'

type AuthContext = Pick<LoginResponse, 'businessType' | 'roles' | 'adminScopes' | 'landingPage'>

function readSessionToken() {
  if (typeof sessionStorage === 'undefined') return { token: null, expiresAt: null }
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  const storedExpiresAt = Number(sessionStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY))
  return { token, expiresAt: Number.isFinite(storedExpiresAt) && storedExpiresAt > 0 ? storedExpiresAt : null }
}

function readAuthContext(): AuthContext | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_CONTEXT_KEY) ?? 'null') as AuthContext | null
  } catch {
    sessionStorage.removeItem(AUTH_CONTEXT_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const sessionToken = readSessionToken()
  const sessionAuthContext = readAuthContext()
  const accessToken = ref<string | null>(sessionToken.token)
  const accessTokenExpiresAt = ref<number | null>(sessionToken.expiresAt)
  const user = ref<User | null>(null)
  const loginBusinessType = ref<BusinessType | null>(sessionAuthContext?.businessType ?? null)
  const roles = ref<LoginResponse['roles']>(sessionAuthContext?.roles ?? [])
  const adminScopes = ref<LoginResponse['adminScopes']>(sessionAuthContext?.adminScopes ?? [])
  const landingPage = ref<LoginResponse['landingPage'] | null>(sessionAuthContext?.landingPage ?? null)
  const loading = ref(false)
  const error = ref('')
  let refreshPromise: Promise<string> | null = null

  const isAuthenticated = computed(
    () =>
      Boolean(accessToken.value),
  )
  const userType = computed(() => roles.value.includes('ADMIN')
    ? 'ADMIN'
    : userTypeFromBusinessType(loginBusinessType.value ?? user.value?.businessType, user.value?.userType))
  const isAdmin = computed(() => roles.value.includes('ADMIN'))
  const isWholesale = computed(() => adminScopes.value.includes('WHOLESALE') || userType.value === 'WHOLESALE')
  const isRetail = computed(() => adminScopes.value.includes('RETAIL') || userType.value === 'RETAIL')
  const adminEntryPath = computed(() => isAdmin.value
    ? '/admin/business-profiles'
    : isWholesale.value
      ? '/admin/supplier/products'
      : '/admin/seller/orders')
  const defaultLandingPath = computed(() => landingPage.value === 'ADMIN_HOME'
    ? '/admin/business-profiles'
    : landingPage.value === 'WHOLESALE_ADMIN'
      ? '/admin/supplier/products'
      : landingPage.value === 'SERVICE_MAIN'
        ? '/'
        : isRetail.value ? '/' : adminEntryPath.value)
  function canAccessAdminRole(role: unknown) {
    if (isAdmin.value) return true
    if (role === 'supplier') return isWholesale.value
    if (role === 'seller') return isRetail.value
    return false
  }

  function clear() {
    accessToken.value = null
    accessTokenExpiresAt.value = null
    user.value = null
    error.value = ''
    refreshPromise = null
    loginBusinessType.value = null
    roles.value = []
    adminScopes.value = []
    landingPage.value = null
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY)
      sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
      sessionStorage.removeItem(AUTH_CONTEXT_KEY)
    }
  }

  function applyAuthContext(response: LoginResponse) {
    loginBusinessType.value = response.businessType
    roles.value = response.roles
    adminScopes.value = response.adminScopes
    landingPage.value = response.landingPage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(AUTH_CONTEXT_KEY, JSON.stringify({
        businessType: response.businessType,
        roles: response.roles,
        adminScopes: response.adminScopes,
        landingPage: response.landingPage,
      }))
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
      applyAuthContext(response)
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
        applyAuthContext(response)
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
    roles,
    adminScopes,
    landingPage,
    loading,
    error,
    isAuthenticated,
    userType,
    isWholesale,
    isRetail,
    isAdmin,
    adminEntryPath,
    defaultLandingPath,
    canAccessAdminRole,
    signUp,
    login,
    fetchCurrentUser,
    refreshAccessToken,
    getValidAccessToken,
    logout,
    clear,
  }
})
