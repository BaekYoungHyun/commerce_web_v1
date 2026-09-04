import { afterEach, describe, expect, it, vi } from 'vitest'
import { categoryApi } from '../categoryApi'

describe('categoryApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('활성 카테고리 트리를 Bearer 인증으로 조회한다', async () => {
    const categories = [
      {
        seq: 1,
        parentSeq: null,
        depth: 1,
        code: 'OUTER',
        name: '아우터',
        sortOrder: 1,
        isActive: true,
        children: [],
      },
    ]
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(categories), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(categoryApi.list('token')).resolves.toEqual(categories)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/categories?activeOnly=true'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    )
  })
})
