import { afterEach, describe, expect, it, vi } from 'vitest'
import { sellerAdminApi } from '../sellerAdminApi'

describe('sellerAdminApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('선택한 소매 매장과 상품으로 찜을 등록한다', async () => {
    const body = { retailStoreSeq: 7, productSeq: 21 }
    const created = {
      seq: 3,
      retail_store_seq: 7,
      retail_store_name: '온라인 셀러샵',
      product_seq: 21,
      product_name: '미니 드레스',
      image_url: null,
      wholesale_store_seq: 2,
      wholesale_store_name: '도매 매장',
      price: 12000,
      total_stock_quantity: 8,
      product_status: 'ACTIVE',
      created_at: '2026-09-09T10:00:00',
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(created), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(sellerAdminApi.addWishlist('token', body)).resolves.toEqual(created)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/seller/wishlists'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }),
    )
  })

  it('셀러 클레임을 확정 계약으로 접수한다', async () => {
    const body = { orderItemSeq: 11, claimType: 'RETURN' as const, quantity: 2, reason: '불량' }
    const created = {
      seq: 5,
      ...body,
      status: 'REQUESTED',
      requestedBy: 3,
      createdAt: '2026-09-07T10:00:00',
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(created), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(sellerAdminApi.createClaim('token', body)).resolves.toEqual(created)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/seller/claims'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }),
    )
  })

  it('본인 사업자 SEQ와 함께 소매 매장을 등록한다', async () => {
    const body = {
      businessProfileSeq: 9,
      storeName: '셀러 매장',
      salesChannel: '온라인몰',
      status: 'ACTIVE' as const,
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ seq: 31, ...body }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await sellerAdminApi.createStore('token', body)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/seller/stores'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }),
    )
  })

  it('소매 매장 수정 시 경로 SEQ를 사용하고 사업자 SEQ를 본문에 보내지 않는다', async () => {
    const body = { storeName: '수정 매장', salesChannel: null, status: 'INACTIVE' as const }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ seq: 31, businessProfileSeq: 9, ...body }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await sellerAdminApi.updateStore('token', 31, body)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/seller/stores/31'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) }),
    )
  })
})
