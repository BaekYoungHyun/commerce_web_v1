import { ref } from 'vue'
import { defineStore } from 'pinia'
import { wholesaleFulfillmentApi } from '../services/wholesaleFulfillmentApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type {
  DeliveryCompanyOption,
  FulfillmentFilters,
  OrderItemFulfillmentStatus,
  ShipmentStatus,
  WholesaleOrder,
  Shipment,
  WholesaleOwnedStore,
} from '../types/wholesaleFulfillment'
import { emptyPage } from '../types/page'

export const useWholesaleFulfillmentStore = defineStore('wholesaleFulfillment', () => {
  const authStore = useAuthStore()
  const stores = ref<WholesaleOwnedStore[]>([])
  const storesLoaded = ref(false)
  const orders = ref<WholesaleOrder[]>([])
  const shipments = ref<Shipment[]>([])
  const ordersPagination = ref(emptyPage<WholesaleOrder>())
  const shipmentsPagination = ref(emptyPage<Shipment>())
  const deliveryCompanies = ref<DeliveryCompanyOption[]>([])
  const loading = ref(false)
  const pendingKey = ref('')
  const error = ref('')

  async function authorized<T>(request: (token: string) => Promise<T>) {
    try {
      return await request(await authStore.getValidAccessToken())
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      return request(await authStore.refreshAccessToken())
    }
  }
  async function run<T>(key: string, request: () => Promise<T>) {
    pendingKey.value = key
    error.value = ''
    try {
      return await request()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '요청을 처리하지 못했습니다.'
      throw cause
    } finally {
      pendingKey.value = ''
    }
  }
  async function fetchOrders(filters: FulfillmentFilters = {}) {
    loading.value = true
    error.value = ''
    try {
      const response = await authorized((token) => wholesaleFulfillmentApi.orders(token, filters))
      ordersPagination.value = response
      const ownedStoreSeqs = new Set(stores.value.map((store) => store.seq))
      orders.value = storesLoaded.value
        ? response.content
            .map((order) => ({
              ...order,
              items: order.items.filter((item) => ownedStoreSeqs.has(item.wholesaleStoreSeq)),
            }))
            .filter((order) => order.items.length > 0)
        : []
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '주문 목록을 불러오지 못했습니다.'
      throw cause
    } finally {
      loading.value = false
    }
  }
  async function fetchStores() {
    try {
      stores.value = await authorized(wholesaleFulfillmentApi.stores)
      storesLoaded.value = true
      return stores.value
    } catch (cause) {
      stores.value = []
      storesLoaded.value = false
      error.value =
        cause instanceof Error ? cause.message : '내 도매 매장 목록을 불러오지 못했습니다.'
      throw cause
    }
  }
  async function updateOrderItemStatus(
    orderSeq: number,
    orderItemSeq: number,
    status: OrderItemFulfillmentStatus,
  ) {
    const updatedOrder = await run(`order-item-${orderItemSeq}`, () =>
      authorized((token) =>
        wholesaleFulfillmentApi.updateOrderItemStatus(token, orderSeq, orderItemSeq, status),
      ),
    )
    const ownedStoreSeqs = new Set(stores.value.map((store) => store.seq))
    const visibleOrder = {
      ...updatedOrder,
      items: updatedOrder.items.filter((item) => ownedStoreSeqs.has(item.wholesaleStoreSeq)),
    }
    orders.value = orders.value.map((order) => (order.orderSeq === orderSeq ? visibleOrder : order))
  }
  async function createShipment(orderSeq: number, wholesaleStoreSeq: number) {
    return run(`shipment-${orderSeq}-${wholesaleStoreSeq}`, () =>
      authorized((token) =>
        wholesaleFulfillmentApi.createShipment(token, orderSeq, {
          wholesaleStoreSeq,
          deliveryCompanyCode: null,
          trackingNumber: null,
        }),
      ),
    )
  }
  async function fetchShipments(filters: FulfillmentFilters = {}) {
    loading.value = true
    error.value = ''
    try {
      const response = await authorized((token) =>
        wholesaleFulfillmentApi.shipments(token, filters),
      )
      shipmentsPagination.value = response
      const ownedStoreSeqs = new Set(stores.value.map((store) => store.seq))
      shipments.value = storesLoaded.value
        ? response.content.filter((shipment) => ownedStoreSeqs.has(shipment.wholesaleStoreSeq))
        : []
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '출고 목록을 불러오지 못했습니다.'
      throw cause
    } finally {
      loading.value = false
    }
  }
  async function fetchDeliveryCompanies() {
    try {
      deliveryCompanies.value = await authorized(wholesaleFulfillmentApi.deliveryCompanies)
      return deliveryCompanies.value
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '택배사 목록을 불러오지 못했습니다.'
      throw cause
    }
  }
  async function updateShipmentStatus(
    shipmentSeq: number,
    status: ShipmentStatus,
    deliveryCompanyCode: string | null,
    trackingNumber: string | null,
  ) {
    const shipment = await run(`shipment-status-${shipmentSeq}`, () =>
      authorized((token) =>
        wholesaleFulfillmentApi.updateShipmentStatus(token, shipmentSeq, {
          status,
          deliveryCompanyCode,
          trackingNumber,
        }),
      ),
    )
    shipments.value = shipments.value.map((current) =>
      current.shipmentSeq === shipment.shipmentSeq ? shipment : current,
    )
  }
  async function updateShipmentQuantity(
    shipmentSeq: number,
    shipmentItemSeq: number,
    quantity: number,
  ) {
    const shipment = await run(`shipment-item-${shipmentItemSeq}`, () =>
      authorized((token) =>
        wholesaleFulfillmentApi.updateShipmentQuantity(
          token,
          shipmentSeq,
          shipmentItemSeq,
          quantity,
        ),
      ),
    )
    shipments.value = shipments.value.map((current) =>
      current.shipmentSeq === shipment.shipmentSeq ? shipment : current,
    )
  }
  return {
    stores,
    storesLoaded,
    orders,
    ordersPagination,
    shipments,
    shipmentsPagination,
    deliveryCompanies,
    loading,
    pendingKey,
    error,
    fetchStores,
    fetchOrders,
    updateOrderItemStatus,
    createShipment,
    fetchShipments,
    fetchDeliveryCompanies,
    updateShipmentStatus,
    updateShipmentQuantity,
  }
})
