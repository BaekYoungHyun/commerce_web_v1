import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { authApi } from '../../services/authApi'
import { useAuthStore } from '../auth'

describe('auth store session', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('로그인 토큰과 만료 시각을 sessionStorage에 저장한다', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      grantType: 'Bearer',
      accessToken: 'session-token',
      accessTokenExpiresIn: 1784878245000,
      businessType: 'RETAIL',
      roles: ['RETAILER'],
      adminScopes: ['RETAIL'],
      landingPage: 'SERVICE_MAIN',
    })
    const store = useAuthStore()

    await store.login({ userId: 'seller01', passwd: 'password' })

    expect(sessionStorage.getItem('commerce.accessToken')).toBe('session-token')
    expect(sessionStorage.getItem('commerce.accessTokenExpiresAt')).toBe('1784878245000')
    expect(sessionStorage.getItem('commerce.authContext')).toContain('SERVICE_MAIN')
  })

  it('로그인 응답의 landingPage와 adminScopes로 관리자 이동과 접근 범위를 결정한다', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      grantType: 'Bearer',
      accessToken: 'admin-token',
      accessTokenExpiresIn: Date.now() + 60_000,
      businessType: 'RETAIL',
      roles: ['ADMIN'],
      adminScopes: ['WHOLESALE', 'RETAIL'],
      landingPage: 'ADMIN_HOME',
    })
    const store = useAuthStore()

    await store.login({ userId: 'admin', passwd: 'password' })

    expect(store.defaultLandingPath).toBe('/admin/business-profiles')
    expect(store.canAccessAdminRole('system')).toBe(true)
    expect(store.canAccessAdminRole('supplier')).toBe(true)
    expect(store.canAccessAdminRole('seller')).toBe(true)
  })

  it('현재 사용자 businessType이 WHOLESALE이면 도매 관리자 경로를 선택한다', async () => {
    const store = useAuthStore()
    store.accessToken = 'session-token'
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({
      seq: 1,
      userId: 'byh1',
      phone: '01000000000',
      name: '도매 사용자',
      status: 'ACTIVE',
      businessType: 'WHOLESALE',
      lastLoginAt: null,
      createdAt: '2026-08-19T00:00:00',
      updatedAt: '2026-08-19T00:00:00',
    })

    await store.fetchCurrentUser()

    expect(store.isWholesale).toBe(true)
    expect(store.defaultLandingPath).toBe('/admin/supplier/products')
  })

  it('만료된 access token을 요청 전에 재발급하고 저장값을 갱신한다', async () => {
    sessionStorage.setItem('commerce.accessToken', 'expired-token')
    sessionStorage.setItem('commerce.accessTokenExpiresAt', String(Date.now() - 1))
    setActivePinia(createPinia())
    const refresh = vi.spyOn(authApi, 'refreshToken').mockResolvedValue({
      grantType: 'Bearer',
      accessToken: 'refreshed-token',
      accessTokenExpiresIn: Date.now() + 60_000,
      businessType: 'RETAIL',
      roles: ['RETAILER'],
      adminScopes: ['RETAIL'],
      landingPage: 'SERVICE_MAIN',
    })
    const store = useAuthStore()

    await expect(store.getValidAccessToken()).resolves.toBe('refreshed-token')
    expect(refresh).toHaveBeenCalledWith('expired-token')
    expect(sessionStorage.getItem('commerce.accessToken')).toBe('refreshed-token')
  })

  it('로그아웃하면 브라우저 세션의 인증 정보를 제거한다', async () => {
    sessionStorage.setItem('commerce.accessToken', 'session-token')
    sessionStorage.setItem('commerce.accessTokenExpiresAt', String(Date.now() + 60_000))
    setActivePinia(createPinia())
    vi.spyOn(authApi, 'logout').mockResolvedValue()
    const store = useAuthStore()

    await store.logout()

    expect(sessionStorage.getItem('commerce.accessToken')).toBeNull()
    expect(sessionStorage.getItem('commerce.accessTokenExpiresAt')).toBeNull()
    expect(sessionStorage.getItem('commerce.authContext')).toBeNull()
  })
})
