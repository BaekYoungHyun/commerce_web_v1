import { afterEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../authApi'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('authApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('회원가입 요청에서 확정된 필드만 전송하고 비밀번호 응답을 제거한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          status: 201,
          message: 'OK',
          code: 1000,
          data: {
            seq: 1,
            userId: 'seller01',
            passwd: '****',
            phone: '01012345678',
            name: '셀러',
            status: 'PENDING',
            lastLoginAt: null,
            createdAt: '2026-07-24T15:30:45',
            updatedAt: '2026-07-24T15:30:45',
          },
          dataTime: '2026-07-24 15:30:45',
          httpStatus: 'CREATED',
        },
        201,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const user = await authApi.signUp({
      userId: 'seller01',
      passwd: 'password1234!',
      phone: '01012345678',
      name: '셀러',
    })

    expect(user).not.toHaveProperty('passwd')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/sign'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          userId: 'seller01',
          passwd: 'password1234!',
          phone: '01012345678',
          name: '셀러',
        }),
      }),
    )
    expect(String(fetchMock.mock.calls[0]![0])).not.toContain('/api/v1/api/v1')
  })

  it('로그인 응답의 epoch millisecond 만료 시각을 그대로 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({
          status: 200,
          message: 'OK',
          code: 1000,
          data: {
            grantType: 'Bearer',
            accessToken: 'access-token',
            accessTokenExpiresIn: 1784878245000,
          },
          dataTime: '2026-07-24 15:30:45',
          httpStatus: 'OK',
        }),
      ),
    )

    await expect(authApi.login({ userId: 'seller01', passwd: 'password1234!' })).resolves.toEqual({
      grantType: 'Bearer',
      accessToken: 'access-token',
      accessTokenExpiresIn: 1784878245000,
    })
  })

  it('로그인 실패의 HTTP 상태와 업무 코드를 ApiError에 보존한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            status: 403,
            message: '비밀번호가 정확하지 않습니다.',
            code: 2047,
            data: null,
            dataTime: '2026-07-24 15:31:00',
            httpStatus: 'FORBIDDEN',
          },
          403,
        ),
      ),
    )

    const request = authApi.login({ userId: 'seller01', passwd: 'wrong-password' })
    await expect(request).rejects.toMatchObject({
      status: 403,
      code: 2047,
      message: '비밀번호가 정확하지 않습니다.',
    })
  })
})
