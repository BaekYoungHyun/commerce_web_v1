export interface CartOrderCreateRequest {
  cartSeqs: number[]
  retailStoreSeq: number
  recipientName: string
  recipientPhone: string
  shippingAddressSeq?: number | null
}

export interface OrderItem {
  seq: number
  wholesaleStoreSeq: number
  wholesaleStoreName: string | null
  productSeq: number
  variantSeq: number
  productName: string
  option: { sku: string; color: string | null; size: string | null } | null
  unitPrice: number
  quantity: number
  lineAmount: number
  status: string
}

export interface SellerOrderShipmentItem {
  shipmentItemSeq: number
  orderItemSeq: number
  quantity: number
}

export interface SellerOrderShipment {
  shipmentSeq: number
  wholesaleStoreSeq: number | null
  wholesaleStoreName: string | null
  deliveryCompanyCode: string | null
  deliveryCompanyName: string | null
  trackingNumber: string | null
  status: string
  shippedAt: string | null
  deliveredAt: string | null
  items: SellerOrderShipmentItem[]
}

export interface Order {
  seq: number
  orderNo: string
  retailStoreSeq: number
  retailStoreName: string | null
  buyerUserSeq: number | null
  buyerUserId: string | null
  buyerName: string | null
  status: string
  subtotalAmount: number
  shippingFee: number
  discountAmount: number
  totalAmount: number
  recipientName: string
  recipientPhone: string
  shippingAddressSeq: number | null
  createdAt: string
  items: OrderItem[]
  shipments: SellerOrderShipment[]
}

export interface OrderCancelResponse {
  seq: number
  orderNo: string
  status: 'CANCELED'
  totalAmount: number
  restoredQuantity: number
}

export type ClaimType = 'CANCEL' | 'RETURN'

export interface ClaimCreateRequest {
  orderItemSeq: number
  claimType: ClaimType
  quantity: number
  reason?: string | null
}

export interface Claim {
  seq: number
  orderItemSeq: number
  claimType: ClaimType
  quantity: number
  reason: string | null
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  requestedBy: number
  createdAt: string
}
