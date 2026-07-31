import { afterEach, describe, expect, it, vi } from 'vitest'
import { cartApi } from '../cartApi'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('cartApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('장바구니 목록을 cartSeq 경로와 Bearer 인증으로 조회한다', async () => {
    const cart = {
      cartSeq: 12,
      retailStoreSeq: 7,
      items: [],
      totalQuantity: 0,
      totalAmount: 0,
      createdAt: '',
      updatedAt: '',
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(cart))
    vi.stubGlobal('fetch', fetchMock)

    await expect(cartApi.list('token', 12)).resolves.toEqual(cart)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/carts/12/items'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    )
  })

  it('variant 식별자로 상품을 추가한다', async () => {
    const payload = { productSeq: 101, variantSeq: 1001, quantity: 2 }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ seq: 3 }, 201))
    vi.stubGlobal('fetch', fetchMock)

    await cartApi.add('token', 12, payload)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/carts/12/items'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    )
  })

  it('수량은 PUT으로 수정하고 삭제 204는 body 없이 처리한다', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ seq: 3, quantity: 4 }))
      .mockResolvedValueOnce(jsonResponse(undefined, 204))
    vi.stubGlobal('fetch', fetchMock)

    await cartApi.updateQuantity('token', 12, 3, { quantity: 4 })
    await expect(cartApi.remove('token', 12, 3)).resolves.toBeUndefined()

    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ quantity: 4 }) }),
    )
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({ method: 'DELETE' }))
  })
})
