import { afterEach, describe, expect, it, vi } from 'vitest'
import { wholesaleFulfillmentApi } from '../wholesaleFulfillmentApi'

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('wholesaleFulfillmentApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('로그인 사용자가 소유한 도매 매장 목록을 조회한다', async () => {
    const stores = [{ seq: 10, storeName: '내 도매 매장', status: 'ACTIVE' }]
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response(stores))
    vi.stubGlobal('fetch', fetchMock)
    await expect(wholesaleFulfillmentApi.stores('token')).resolves.toEqual(stores)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/wholesale/stores'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) }),
    )
  })

  it('도매 매장과 상태로 주문 목록을 조회한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response([]))
    vi.stubGlobal('fetch', fetchMock)
    await wholesaleFulfillmentApi.orders('token', { wholesaleStoreSeq: 10, status: 'PRODUCT_READY' })
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/wholesale/orders?wholesaleStoreSeq=10&status=PRODUCT_READY')
    expect(fetchMock.mock.calls[0]![1]).toEqual(expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) }))
  })

  it('주문 상품 상태를 PATCH로 변경한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response({ orderSeq: 1, items: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await wholesaleFulfillmentApi.updateOrderItemStatus('token', 1, 2, 'PRODUCT_PREPARING')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/wholesale/orders/1/items/2/status'), expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'PRODUCT_PREPARING' }) }))
  })

  it('출고 상태와 수량을 별도 경로로 변경한다', async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ shipmentSeq: 5, items: [] }))
      .mockResolvedValueOnce(response({ shipmentSeq: 5, items: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await wholesaleFulfillmentApi.updateShipmentStatus('token', 5, { status: 'SHIPPED', deliveryCompanyCode: 'CJ', trackingNumber: '123' })
    await wholesaleFulfillmentApi.updateShipmentQuantity('token', 5, 8, 3)
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/wholesale/shipments/5/status')
    expect(fetchMock.mock.calls[1]![1]).toEqual(expect.objectContaining({ method: 'PUT', body: JSON.stringify({ quantity: 3 }) }))
  })

  it('도매 출고용 활성 택배사 선택 목록을 조회한다', async () => {
    const companies = [{ code: 'CJ', name: 'CJ대한통운' }]
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response(companies))
    vi.stubGlobal('fetch', fetchMock)
    await expect(wholesaleFulfillmentApi.deliveryCompanies('token')).resolves.toEqual(companies)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/wholesale/delivery-companies'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) }),
    )
  })
})
