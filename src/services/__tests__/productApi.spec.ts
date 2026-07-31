import { afterEach, describe, expect, it, vi } from 'vitest'
import { productApi } from '../productApi'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('productApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('상품 상세를 Bearer 인증으로 조회한다', async () => {
    const product = { seq: 1, wholesaleStoreId: 10, categorySeq: 3, name: '셔츠', description: null, status: 'DRAFT', minOrderQuantity: 2, createdAt: '2026-07-25T10:30:00+09:00', updatedAt: '2026-07-25T10:30:00+09:00', images: [], options: [], variants: [], viewCount: 0 }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(product))
    vi.stubGlobal('fetch', fetchMock)

    await expect(productApi.detail('token', 1)).resolves.toEqual(product)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/products/1'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) }))
    expect(String(fetchMock.mock.calls[0]![0])).not.toContain('/api/v1/api/v1')
  })

  it('상품 조회 로그를 사용자 정보와 함께 등록한다', async () => {
    const view = { seq: 7, userId: 3, productSeq: 1, viewedAt: '2026-07-31T10:00:00+09:00' }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(view, 201))
    vi.stubGlobal('fetch', fetchMock)

    await expect(productApi.createView('token', 1, { userId: 3 })).resolves.toEqual(view)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/products/1/views'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
        body: JSON.stringify({ userId: 3 }),
      }),
    )
  })

  it('상품 수정은 PUT과 전체 필수 필드를 전송한다', async () => {
    const payload = { wholesaleStoreId: 10, categorySeq: 3, name: '수정 셔츠', description: null, status: 'DRAFT', minOrderQuantity: 2, images: [], options: [], variants: [] }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ seq: 1, ...payload, createdAt: '', updatedAt: '' }))
    vi.stubGlobal('fetch', fetchMock)

    await productApi.update('token', 1, payload)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/products/1'), expect.objectContaining({ method: 'PUT', body: JSON.stringify(payload) }))
    expect(String(fetchMock.mock.calls[0]![0])).not.toContain('/api/v1/api/v1')
  })

  it('검증 오류의 필드 메시지를 ApiError에 보존한다', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ timestamp: '', code: 'C001', message: 'Invalid input.', errors: [{ field: 'name', message: 'must not be blank' }] }, 400)))

    await expect(productApi.create('token', { wholesaleStoreId: 10, categorySeq: 3, name: '', images: [], options: [], variants: [] })).rejects.toMatchObject({ status: 400, code: 'C001', fieldErrors: { name: 'must not be blank' } })
  })

  it('상품 목록에 categorySeq 검색 조건을 전송한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }))
    vi.stubGlobal('fetch', fetchMock)

    await productApi.list('token', { page: 0, categorySeq: 8, name: '셔츠' })

    expect(String(fetchMock.mock.calls[0]![0])).toContain('/products?page=0&categorySeq=8&name=')
  })
})
