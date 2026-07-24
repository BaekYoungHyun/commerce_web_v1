export type CartItem = {
  id: number
  productId: number
  supplierId: number
  supplierName: string
  productName: string
  imageUrl: string
  optionName: string
  unitPrice: number
  retailPrice: number
  minOrderQuantity: number
  quantity: number
  stockQuantity: number
  shippingFee: number
  freeShippingThreshold: number
  checked: boolean
}

export type AddCartItemRequest = {
  productId: number
  optionName: string
  quantity: number
}

export type UpdateCartItemRequest = {
  quantity?: number
  checked?: boolean
}
