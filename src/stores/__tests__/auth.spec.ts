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
    })
    const store = useAuthStore()

    await store.login({ userId: 'seller01', passwd: 'password' })

    expect(sessionStorage.getItem('commerce.accessToken')).toBe('session-token')
    expect(sessionStorage.getItem('commerce.accessTokenExpiresAt')).toBe('1784878245000')
  })

  it('만료된 access token을 요청 전에 재발급하고 저장값을 갱신한다', async () => {
    sessionStorage.setItem('commerce.accessToken', 'expired-token')
    sessionStorage.setItem('commerce.accessTokenExpiresAt', String(Date.now() - 1))
    setActivePinia(createPinia())
    const refresh = vi.spyOn(authApi, 'refreshToken').mockResolvedValue({
      grantType: 'Bearer',
      accessToken: 'refreshed-token',
      accessTokenExpiresIn: Date.now() + 60_000,
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
  })
})
