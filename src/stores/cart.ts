import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cartApi } from '../services/cartApi'
import type { AddCartItemRequest, CartItem } from '../types/cart'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const loading = ref(false)
  const error = ref('')
  const initialized = ref(false)

  const checkedItems = computed(() => items.value.filter((item) => item.checked))
  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const checkedCount = computed(() => checkedItems.value.reduce((sum, item) => sum + item.quantity, 0))
  const productAmount = computed(() =>
    checkedItems.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  )
  const shippingAmount = computed(() => {
    const suppliers = new Map<number, CartItem[]>()
    for (const item of checkedItems.value) {
      suppliers.set(item.supplierId, [...(suppliers.get(item.supplierId) ?? []), item])
    }
    return [...suppliers.values()].reduce((sum, supplierItems) => {
      const amount = supplierItems.reduce((subtotal, item) => subtotal + item.unitPrice * item.quantity, 0)
      const sample = supplierItems[0]!
      return sum + (amount >= sample.freeShippingThreshold ? 0 : sample.shippingFee)
    }, 0)
  })
  const totalAmount = computed(() => productAmount.value + shippingAmount.value)
  const allChecked = computed(
    () => items.value.length > 0 && items.value.every((item) => item.checked),
  )

  async function run(request: () => Promise<CartItem[]>) {
    loading.value = true
    error.value = ''
    try {
      items.value = await request()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '장바구니 요청에 실패했습니다.'
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function loadCart() {
    if (initialized.value) return
    await run(() => cartApi.getCart())
    initialized.value = true
  }

  async function addItem(payload: AddCartItemRequest) {
    await run(() => cartApi.addItem(payload))
    initialized.value = true
  }

  async function updateQuantity(item: CartItem, quantity: number) {
    await run(() => cartApi.updateItem(item.id, { quantity }))
  }

  async function toggleItem(item: CartItem) {
    await run(() => cartApi.updateItem(item.id, { checked: !item.checked }))
  }

  async function toggleAll() {
    const target = !allChecked.value
    for (const item of items.value.filter((cartItem) => cartItem.checked !== target)) {
      items.value = await cartApi.updateItem(item.id, { checked: target })
    }
  }

  async function removeItems(ids: number[]) {
    if (!ids.length) return
    await run(() => cartApi.removeItems(ids))
  }

  return {
    items,
    loading,
    error,
    initialized,
    checkedItems,
    itemCount,
    checkedCount,
    productAmount,
    shippingAmount,
    totalAmount,
    allChecked,
    loadCart,
    addItem,
    updateQuantity,
    toggleItem,
    toggleAll,
    removeItems,
  }
})
