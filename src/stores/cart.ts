import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cartApi } from '../services/cartApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { Cart, CartItem, CartItemAddRequest } from '../types/cart'

const CART_SEQ_KEY = 'commerce.cartSeq'

function initialCartSeq() {
  const configured = Number(import.meta.env.VITE_CART_SEQ)
  const stored =
    typeof sessionStorage === 'undefined' ? Number.NaN : Number(sessionStorage.getItem(CART_SEQ_KEY))
  const value = Number.isInteger(stored) && stored > 0 ? stored : configured
  return Number.isInteger(value) && value > 0 ? value : null
}

export const useCartStore = defineStore('cart', () => {
  const authStore = useAuthStore()
  const cart = ref<Cart | null>(null)
  const cartSeq = ref<number | null>(initialCartSeq())
  const selectedItemSeqs = ref<Set<number>>(new Set())
  const loading = ref(false)
  const pendingItemSeqs = ref<Set<number>>(new Set())
  const error = ref('')
  const initialized = ref(false)

  const items = computed(() => cart.value?.items ?? [])
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

  function setCartSeq(value: number) {
    if (!Number.isInteger(value) || value <= 0) throw new Error('올바른 장바구니 식별자가 필요합니다.')
    cartSeq.value = value
    initialized.value = false
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(CART_SEQ_KEY, String(value))
  }

  function clearCart() {
    cart.value = null
    selectedItemSeqs.value = new Set()
    error.value = ''
    initialized.value = false
  }

  function requireCartSeq() {
    if (cartSeq.value === null) {
      throw new Error('사용할 장바구니가 없습니다. 소매 매장 장바구니를 먼저 생성해 주세요.')
    }
    return cartSeq.value
  }

  async function accessToken() {
    return authStore.getValidAccessToken()
  }

  async function withAuth<T>(request: (token: string) => Promise<T>) {
    try {
      return await request(await accessToken())
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      return request(await authStore.refreshAccessToken())
    }
  }

  function syncSelection(nextItems: CartItem[], selectAll = false) {
    const available = new Set(nextItems.map((item) => item.seq))
    selectedItemSeqs.value = selectAll
      ? available
      : new Set([...selectedItemSeqs.value].filter((seq) => available.has(seq)))
  }

  async function fetchCart(selectAll = false) {
    const seq = requireCartSeq()
    const response = await withAuth((token) => cartApi.list(token, seq))
    cart.value = response
    syncSelection(response.items, selectAll)
    return response
  }

  async function run(request: () => Promise<void>) {
    loading.value = true
    error.value = ''
    try {
      await request()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '장바구니 요청에 실패했습니다.'
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function loadCart(force = false) {
    if (initialized.value && !force) return
    await run(async () => {
      await fetchCart(true)
      initialized.value = true
    })
  }

  async function addItem(payload: CartItemAddRequest) {
    if (payload.quantity < 1) throw new Error('수량은 1개 이상이어야 합니다.')
    await run(async () => {
      const seq = requireCartSeq()
      await withAuth((token) => cartApi.add(token, seq, payload))
      await fetchCart()
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
      const seq = requireCartSeq()
      const updated = await withAuth((token) =>
        cartApi.updateQuantity(token, seq, item.seq, { quantity }),
      )
      if (cart.value) {
        cart.value = {
          ...cart.value,
          items: cart.value.items.map((current) => (current.seq === updated.seq ? updated : current)),
          totalQuantity:
            cart.value.totalQuantity - item.quantity + updated.quantity,
          totalAmount:
            cart.value.totalAmount - item.lineAmount + updated.lineAmount,
        }
      }
      error.value = ''
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '수량 변경에 실패했습니다.'
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
      const seq = requireCartSeq()
      for (const id of ids) {
        try {
          await withAuth((token) => cartApi.remove(token, seq, id))
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
    cartSeq,
    items,
    loading,
    pendingItemSeqs,
    error,
    initialized,
    checkedItems,
    itemCount,
    checkedCount,
    productAmount,
    allChecked,
    setCartSeq,
    clearCart,
    loadCart,
    addItem,
    updateQuantity,
    toggleItem,
    toggleAll,
    removeItems,
  }
})
