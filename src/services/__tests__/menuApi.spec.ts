import { afterEach, describe, expect, it, vi } from 'vitest'
import { menuApi } from '../menuApi'

describe('menuApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('선택한 관리자 scope의 2뎁스 메뉴를 조회한다', async () => {
    const menus = [
      {
        seq: 1,
        code: 'MASTER',
        name: '마스터 관리',
        depth: 1,
        routePath: null,
        icon: null,
        sortOrder: 1,
        children: [],
      },
    ]
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(menus), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(menuApi.navigation('token', 'WHOLESALE')).resolves.toEqual(menus)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/menus/navigation?scope=WHOLESALE'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    )
  })
})
