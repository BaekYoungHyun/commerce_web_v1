import { products } from '../data/products'
import type { AddCartItemRequest, CartItem, UpdateCartItemRequest } from '../types/cart'
import { apiRequest } from './httpClient'

export type CartApi = {
  getCart(): Promise<CartItem[]>
  addItem(payload: AddCartItemRequest): Promise<CartItem[]>
  updateItem(cartItemId: number, payload: UpdateCartItemRequest): Promise<CartItem[]>
  removeItems(cartItemIds: number[]): Promise<CartItem[]>
}

const createMockItem = (productId: number, optionName: string, quantity: number, id: number): CartItem => {
  const product = products.find((item) => item.id === productId) ?? products[0]!
  return {
    id,
    productId: product.id,
    supplierId: product.supplier.charCodeAt(0),
    supplierName: product.supplier,
    productName: product.name,
    imageUrl: product.image,
    optionName,
    unitPrice: product.price,
    retailPrice: product.retailPrice,
    minOrderQuantity: product.minOrder,
    quantity: Math.max(product.minOrder, quantity),
    stockQuantity: product.stock,
    shippingFee: 3000,
    freeShippingThreshold: 100000,
    checked: true,
  }
}

let mockItems: CartItem[] = [
  createMockItem(301, '아이보리', 3, 1),
  createMockItem(1, '카키', 2, 2),
]

const wait = () => new Promise((resolve) => window.setTimeout(resolve, 120))
const copyItems = () => mockItems.map((item) => ({ ...item }))

const mockCartApi: CartApi = {
  async getCart() {
    await wait()
    return copyItems()
  },
  async addItem(payload) {
    await wait()
    const existing = mockItems.find(
      (item) => item.productId === payload.productId && item.optionName === payload.optionName,
    )
    if (existing) {
      existing.quantity = Math.min(existing.stockQuantity, existing.quantity + payload.quantity)
      existing.checked = true
    } else {
      mockItems.push(createMockItem(payload.productId, payload.optionName, payload.quantity, Date.now()))
    }
    return copyItems()
  },
  async updateItem(cartItemId, payload) {
    await wait()
    const item = mockItems.find((cartItem) => cartItem.id === cartItemId)
    if (item) {
      if (payload.quantity !== undefined) {
        item.quantity = Math.min(item.stockQuantity, Math.max(item.minOrderQuantity, payload.quantity))
      }
      if (payload.checked !== undefined) item.checked = payload.checked
    }
    return copyItems()
  },
  async removeItems(cartItemIds) {
    await wait()
    mockItems = mockItems.filter((item) => !cartItemIds.includes(item.id))
    return copyItems()
  },
}

const remoteCartApi: CartApi = {
  getCart: () => apiRequest<CartItem[]>('/cart'),
  addItem: (payload) =>
    apiRequest<CartItem[]>('/cart/items', { method: 'POST', body: JSON.stringify(payload) }),
  updateItem: (cartItemId, payload) =>
    apiRequest<CartItem[]>(`/cart/items/${cartItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  removeItems: (cartItemIds) =>
    apiRequest<CartItem[]>('/cart/items', {
      method: 'DELETE',
      body: JSON.stringify({ cartItemIds }),
    }),
}

// API 명세 확정 후 VITE_USE_MOCK_API=false로 전환한다.
export const cartApi: CartApi =
  String(import.meta.env.VITE_USE_MOCK_API ?? 'true') === 'true' ? mockCartApi : remoteCartApi
