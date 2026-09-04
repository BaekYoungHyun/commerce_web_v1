import { afterEach, describe, expect, it, vi } from 'vitest'
import { orderApi } from '../orderApi'

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const order = { seq: 9, orderNo: 'O-9', items: [], totalAmount: 10000 }

describe('orderApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('선택한 CartItem.seq와 수령 정보를 주문 생성 API에 전송한다', async () => {
    const body = { cartSeqs: [11, 12], retailStoreSeq: 3, recipientName: '홍길동', recipientPhone: '01012345678', shippingAddressSeq: null }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response(order, 201))
    vi.stubGlobal('fetch', fetchMock)
    await expect(orderApi.createFromCart('token', body)).resolves.toEqual(order)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/orders/from-cart'), expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer token' }), body: JSON.stringify(body) }))
  })

  it('내 주문 목록과 상세를 Bearer 인증으로 조회한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(response([order])).mockResolvedValueOnce(response(order))
    vi.stubGlobal('fetch', fetchMock)
    await expect(orderApi.myOrders('token')).resolves.toEqual([order])
    await expect(orderApi.myOrder('token', 9)).resolves.toEqual(order)
    expect(String(fetchMock.mock.calls[1]![0])).toContain('/orders/9')
  })

  it('관리자 전체 주문 목록을 조회한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response([order]))
    vi.stubGlobal('fetch', fetchMock)
    await orderApi.adminOrders('token')
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/api/v1/admin/orders')
  })

  it('주문 업무 오류의 코드와 한글 상세 사유를 보존한다', async () => {
    const message = '상품 옵션 1001의 주문 가능 재고가 부족합니다. 주문 가능 수량: 2, 요청 수량: 5'
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(response({
      timestamp: '2026-08-11T21:10:00',
      code: 'P002',
      message,
      errors: [],
    }, 409)))

    await expect(orderApi.createFromCart('token', {
      cartSeqs: [11],
      retailStoreSeq: 3,
      recipientName: '홍길동',
      recipientPhone: '01012345678',
      shippingAddressSeq: null,
    })).rejects.toMatchObject({ status: 409, code: 'P002', message })
  })
})
