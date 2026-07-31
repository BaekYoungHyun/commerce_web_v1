export interface CartItem {
  seq: number
  cartSeq: number
  productSeq: number
  productName: string
  imageUrl: string | null
  variantSeq: number
  sku: string
  color: string | null
  size: string | null
  salePrice: number
  quantity: number
  lineAmount: number
  createdAt: string
}

export interface Cart {
  cartSeq: number
  retailStoreSeq: number
  items: CartItem[]
  totalQuantity: number
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export interface CartItemAddRequest {
  productSeq: number
  variantSeq: number
  quantity: number
}

export interface CartItemUpdateRequest {
  quantity: number
}
