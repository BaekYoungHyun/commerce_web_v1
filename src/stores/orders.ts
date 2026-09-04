import { ref } from 'vue'
import { defineStore } from 'pinia'
import { orderApi } from '../services/orderApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { CartOrderCreateRequest, Order } from '../types/order'
import type { OrderListQuery } from '../services/orderApi'
import { emptyPage } from '../types/page'

export const useOrdersStore = defineStore('orders', () => {
  const authStore = useAuthStore()
  const orders = ref<Order[]>([])
  const pagination = ref(emptyPage<Order>())
  const currentOrder = ref<Order | null>(null)
  const loading = ref(false)
  const creating = ref(false)
  const error = ref('')
  const errorCode = ref<string | number | null>(null)

  async function authorized<T>(request: (token: string) => Promise<T>) {
    try {
      return await request(await authStore.getValidAccessToken())
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      return request(await authStore.refreshAccessToken())
    }
  }
  function fail(cause: unknown, fallback: string) {
    error.value = cause instanceof Error ? cause.message : fallback
    errorCode.value = cause instanceof ApiError ? cause.code : null
  }
  async function createFromCart(body: CartOrderCreateRequest) {
    creating.value = true
    error.value = ''
    errorCode.value = null
    try {
      const createdOrders = await authorized((token) => orderApi.createFromCart(token, body))
      currentOrder.value = createdOrders[0] ?? null
      return createdOrders
    } catch (cause) {
      fail(cause, '주문을 생성하지 못했습니다.')
      throw cause
    } finally {
      creating.value = false
    }
  }
  async function fetchOrders(admin = false, filters: OrderListQuery = {}) {
    loading.value = true
    error.value = ''
    errorCode.value = null
    try {
      const response = await authorized((token) =>
        admin ? orderApi.adminOrders(token, filters) : orderApi.myOrders(token, filters),
      )
      pagination.value = response
      orders.value = response.content
      return response
    } catch (cause) {
      fail(cause, '주문 목록을 불러오지 못했습니다.')
      throw cause
    } finally {
      loading.value = false
    }
  }
  async function fetchOrder(seq: number) {
    loading.value = true
    error.value = ''
    errorCode.value = null
    try {
      currentOrder.value = await authorized((token) => orderApi.myOrder(token, seq))
      return currentOrder.value
    } catch (cause) {
      currentOrder.value = null
      fail(cause, '주문을 불러오지 못했습니다.')
      throw cause
    } finally {
      loading.value = false
    }
  }
  return {
    orders,
    pagination,
    currentOrder,
    loading,
    creating,
    error,
    errorCode,
    createFromCart,
    fetchOrders,
    fetchOrder,
  }
})
