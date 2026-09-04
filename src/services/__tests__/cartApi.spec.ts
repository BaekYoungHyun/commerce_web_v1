import { afterEach, describe, expect, it, vi } from 'vitest'
import { cartApi } from '../cartApi'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const cart = {
  userSeq: 5,
  buyer: { userSeq: 5, name: '도매 사용자', phone: '01000000000', businessProfileSeq: null, businessNumber: null, companyName: null, representativeName: null, retailStoreSeq: null, retailStoreName: null, salesChannel: null },
  wholesales: [],
  totalQuantity: 0,
  totalAmount: 0,
}

describe('cartApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('로그인 사용자의 장바구니를 Bearer 인증으로 조회한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(cart))
    vi.stubGlobal('fetch', fetchMock)

    const result = await cartApi.list('token')
    expect(result).toEqual(cart)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/carts'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    )
    expect(String(fetchMock.mock.calls[0]![0])).not.toContain('/carts/')
    expect(result.buyer.retailStoreSeq).toBeNull()
  })

  it('사용자나 매장 식별자 없이 variant 상품을 추가한다', async () => {
    const payload = { productSeq: 101, variantSeq: 1001, quantity: 2 }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(cart, 201))
    vi.stubGlobal('fetch', fetchMock)

    await expect(cartApi.add('token', payload)).resolves.toEqual(cart)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/carts'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    )
  })

  it('CartItem.seq를 경로 식별자로 사용해 수량을 PUT 수정한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(cart))
    vi.stubGlobal('fetch', fetchMock)

    await expect(cartApi.updateQuantity('token', 31, { quantity: 4 })).resolves.toEqual(cart)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/carts/31'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ quantity: 4 }) }),
    )
  })

  it('CartItem.seq로 삭제하고 204 body를 파싱하지 않는다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(undefined, 204))
    vi.stubGlobal('fetch', fetchMock)

    await expect(cartApi.remove('token', 31)).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/carts/31'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
