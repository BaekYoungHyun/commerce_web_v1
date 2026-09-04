import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { wholesaleFulfillmentApi } from '../../services/wholesaleFulfillmentApi'
import { useAuthStore } from '../auth'
import { useWholesaleFulfillmentStore } from '../wholesaleFulfillment'

describe('wholesaleFulfillment store', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    useAuthStore().accessToken = 'access-token'
  })

  it('소유 매장에 포함되지 않은 주문 품목을 화면 상태에서 제외한다', async () => {
    vi.spyOn(wholesaleFulfillmentApi, 'stores').mockResolvedValue([
      { seq: 2, storeName: 'YH 도매', status: 'ACTIVE' },
    ])
    vi.spyOn(wholesaleFulfillmentApi, 'orders').mockResolvedValue({
      content: [
        {
          orderSeq: 1,
          orderNo: 'ORD-1',
          status: 'ORDERED',
          retailStoreSeq: 3,
          retailStoreName: '셀러 매장',
          buyerCompanyName: '셀러 사업자',
          recipientName: '구매자',
          recipientPhone: '010-0000-0000',
          createdAt: '2026-08-24T09:00:00+09:00',
          items: [
            {
              orderItemSeq: 11,
              wholesaleStoreSeq: 1,
              wholesaleStoreName: '도매 매장 1-2',
              productSeq: 101,
              variantSeq: 1001,
              productName: '비소유 상품',
              sku: null,
              color: null,
              size: null,
              unitPrice: 1000,
              quantity: 1,
              lineAmount: 1000,
              status: 'PRODUCT_ORDERED',
            },
            {
              orderItemSeq: 12,
              wholesaleStoreSeq: 2,
              wholesaleStoreName: 'YH 도매',
              productSeq: 102,
              variantSeq: 1002,
              productName: '소유 상품',
              sku: 'SKU-2',
              color: '검정',
              size: 'M',
              unitPrice: 2000,
              quantity: 1,
              lineAmount: 2000,
              status: 'PRODUCT_ORDERED',
            },
          ],
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    })
    const store = useWholesaleFulfillmentStore()

    await store.fetchStores()
    await store.fetchOrders()

    expect(store.orders).toHaveLength(1)
    expect(store.orders[0]?.items.map((item) => item.wholesaleStoreName)).toEqual(['YH 도매'])
  })

  it('소유 매장 목록을 확인하기 전에는 주문을 화면 상태에 저장하지 않는다', async () => {
    vi.spyOn(wholesaleFulfillmentApi, 'orders').mockResolvedValue({
      content: [
        {
          orderSeq: 1,
          orderNo: 'ORD-1',
          status: 'ORDERED',
          retailStoreSeq: 3,
          retailStoreName: null,
          buyerCompanyName: null,
          recipientName: '구매자',
          recipientPhone: '010-0000-0000',
          createdAt: '2026-08-24T09:00:00+09:00',
          items: [
            {
              orderItemSeq: 11,
              wholesaleStoreSeq: 1,
              wholesaleStoreName: '도매 매장 1-2',
              productSeq: 101,
              variantSeq: 1001,
              productName: '상품',
              sku: null,
              color: null,
              size: null,
              unitPrice: 1000,
              quantity: 1,
              lineAmount: 1000,
              status: 'PRODUCT_ORDERED',
            },
          ],
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    })
    const store = useWholesaleFulfillmentStore()

    await store.fetchOrders()

    expect(store.orders).toEqual([])
  })

  it('주문 품목 상태 변경 응답의 전체 주문으로 기존 주문을 교체한다', async () => {
    const store = useWholesaleFulfillmentStore()
    store.stores = [{ seq: 2, storeName: 'YH 도매', status: 'ACTIVE' }]
    store.orders = [
      {
        orderSeq: 1,
        orderNo: 'ORD-1',
        status: 'ORDERED',
        retailStoreSeq: 3,
        retailStoreName: '셀러 매장',
        buyerCompanyName: '셀러 사업자',
        recipientName: '구매자',
        recipientPhone: '010-0000-0000',
        createdAt: '2026-08-24T09:00:00+09:00',
        items: [
          {
            orderItemSeq: 12,
            wholesaleStoreSeq: 2,
            wholesaleStoreName: 'YH 도매',
            productSeq: 102,
            variantSeq: 1002,
            productName: '상품',
            sku: 'SKU-2',
            color: null,
            size: null,
            unitPrice: 2000,
            quantity: 1,
            lineAmount: 2000,
            status: 'PRODUCT_ORDERED',
          },
        ],
      },
    ]
    vi.spyOn(wholesaleFulfillmentApi, 'updateOrderItemStatus').mockResolvedValue({
      ...store.orders[0]!,
      status: 'PREPARING',
      items: [{ ...store.orders[0]!.items[0]!, status: 'PRODUCT_PREPARING' }],
    })

    await store.updateOrderItemStatus(1, 12, 'PRODUCT_PREPARING')

    expect(store.orders[0]?.status).toBe('PREPARING')
    expect(store.orders[0]?.items[0]?.status).toBe('PRODUCT_PREPARING')
  })
})
