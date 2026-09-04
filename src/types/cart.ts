export interface CartItem {
  seq: number
  wholesaleStoreSeq: number
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

export interface CartBuyer {
  userSeq: number
  name: string
  phone: string
  businessProfileSeq: number | null
  businessNumber: string | null
  companyName: string | null
  representativeName: string | null
  retailStoreSeq: number | null
  retailStoreName: string | null
  salesChannel: string | null
}

export interface CartWholesaleGroup {
  wholesaleStoreSeq: number
  wholesaleStoreName: string
  marketName: string | null
  floorRoom: string | null
  businessProfileSeq: number
  businessNumber: string
  companyName: string
  representativeName: string
  items: CartItem[]
  totalQuantity: number
  subtotalAmount: number
}

export interface Cart {
  userSeq: number
  buyer: CartBuyer
  wholesales: CartWholesaleGroup[]
  totalQuantity: number
  totalAmount: number
}

export interface CartItemAddRequest {
  productSeq: number
  variantSeq: number
  quantity: number
}

export interface CartItemUpdateRequest {
  quantity: number
}
