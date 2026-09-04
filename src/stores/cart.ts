import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cartApi } from '../services/cartApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { Cart, CartItem, CartItemAddRequest } from '../types/cart'

export const useCartStore = defineStore('cart', () => {
  const authStore = useAuthStore()
  const cart = ref<Cart | null>(null)
  const selectedItemSeqs = ref<Set<number>>(new Set())
  const loading = ref(false)
  const pendingItemSeqs = ref<Set<number>>(new Set())
  const error = ref('')
  const errorCode = ref<string | number | null>(null)
  const initialized = ref(false)
  let loadPromise: Promise<void> | null = null

  const wholesaleGroups = computed(() => cart.value?.wholesales ?? [])
  const items = computed(() => wholesaleGroups.value.flatMap((group) => group.items))
  const checkedItems = computed(() =>
    items.value.filter((item) => selectedItemSeqs.value.has(item.seq)),
  )
  const itemCount = computed(() => cart.value?.totalQuantity ?? 0)
  const checkedCount = computed(() =>
    checkedItems.value.reduce((sum, item) => sum + item.quantity, 0),
  )
  const productAmount = computed(() =>
    checkedItems.value.reduce((sum, item) => sum + item.lineAmount, 0),
  )
  const allChecked = computed(
    () => items.value.length > 0 && items.value.every((item) => selectedItemSeqs.value.has(item.seq)),
  )

  function clearCart() {
    cart.value = null
    selectedItemSeqs.value = new Set()
    error.value = ''
    errorCode.value = null
    initialized.value = false
  }

  async function withAuth<T>(request: (token: string) => Promise<T>) {
    try {
      return await request(await authStore.getValidAccessToken())
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      return request(await authStore.refreshAccessToken())
    }
  }

  function syncSelection(nextCart: Cart, selectAll = false) {
    const nextItems = nextCart.wholesales.flatMap((group) => group.items)
    const available = new Set(nextItems.map((item) => item.seq))
    selectedItemSeqs.value = selectAll
      ? available
      : new Set([...selectedItemSeqs.value].filter((seq) => available.has(seq)))
  }

  function applyCart(nextCart: Cart, selectAll = false) {
    cart.value = nextCart
    syncSelection(nextCart, selectAll)
  }

  async function fetchCart(selectAll = false) {
    const response = await withAuth((token) => cartApi.list(token))
    applyCart(response, selectAll)
    return response
  }

  async function run(request: () => Promise<void>) {
    loading.value = true
    error.value = ''
    errorCode.value = null
    try {
      await request()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '장바구니 요청에 실패했습니다.'
      errorCode.value = cause instanceof ApiError ? cause.code : null
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function loadCart(force = false) {
    if (initialized.value && !force) {
      if (cart.value) syncSelection(cart.value, true)
      return
    }
    if (loadPromise) return loadPromise
    loadPromise = run(async () => {
      await fetchCart(true)
      initialized.value = true
    }).finally(() => {
      loadPromise = null
    })
    return loadPromise
  }

  async function addItem(payload: CartItemAddRequest) {
    if (payload.quantity < 1) throw new Error('수량은 1개 이상이어야 합니다.')
    await run(async () => {
      const response = await withAuth((token) => cartApi.add(token, payload))
      applyCart(response, true)
      initialized.value = true
    })
  }

  async function updateQuantity(item: CartItem, quantity: number) {
    if (quantity < 1) {
      error.value = '수량은 1개 이상이어야 합니다.'
      return
    }
    pendingItemSeqs.value = new Set([...pendingItemSeqs.value, item.seq])
    try {
      const response = await withAuth((token) =>
        cartApi.updateQuantity(token, item.seq, { quantity }),
      )
      applyCart(response)
      error.value = ''
      errorCode.value = null
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '수량 변경에 실패했습니다.'
      errorCode.value = cause instanceof ApiError ? cause.code : null
      if (cause instanceof ApiError && ['CART002', 'CART003'].includes(String(cause.code))) {
        await fetchCart()
      }
      throw cause
    } finally {
      const next = new Set(pendingItemSeqs.value)
      next.delete(item.seq)
      pendingItemSeqs.value = next
    }
  }

  function toggleItem(item: CartItem) {
    const next = new Set(selectedItemSeqs.value)
    if (next.has(item.seq)) next.delete(item.seq)
    else next.add(item.seq)
    selectedItemSeqs.value = next
  }

  function toggleAll() {
    selectedItemSeqs.value = allChecked.value
      ? new Set()
      : new Set(items.value.map((item) => item.seq))
  }

  async function removeItems(ids: number[]) {
    if (!ids.length) return
    await run(async () => {
      for (const id of ids) {
        try {
          await withAuth((token) => cartApi.remove(token, id))
        } catch (cause) {
          if (!(cause instanceof ApiError) || !['CART002', 'CART003'].includes(String(cause.code))) {
            throw cause
          }
        }
      }
      await fetchCart()
    })
  }

  return {
    cart,
    wholesaleGroups,
    items,
    loading,
    pendingItemSeqs,
    error,
    errorCode,
    initialized,
    checkedItems,
    itemCount,
    checkedCount,
    productAmount,
    allChecked,
    clearCart,
    loadCart,
    addItem,
    updateQuantity,
    toggleItem,
    toggleAll,
    removeItems,
  }
})
