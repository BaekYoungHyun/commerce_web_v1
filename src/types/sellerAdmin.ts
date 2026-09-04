export interface SellerDashboard {
  store_count: number
  order_count: number
  total_order_amount: number
  wishlist_count: number
  unread_notification_count: number
}

export interface SellerAddress {
  seq: number
  retail_store_seq: number
  postal_code: string
  address1: string
  address2: string | null
  is_default: boolean
}

export interface SellerAddressRequest {
  retailStoreSeq: number
  postalCode: string
  address1: string
  address2?: string | null
  isDefault: boolean
}

export interface SellerPayment {
  payment_seq: number
  order_seq: number
  order_no: string
  payment_method: 'CARD' | 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT'
  status: 'READY' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  amount: number
  pg_provider: string | null
  pg_transaction_id: string | null
  paid_at: string | null
  refund_seq: number | null
  refund_amount: number | null
  refund_reason: string | null
  refund_status: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | null
}

export interface RefundRequest {
  paymentSeq: number
  amount: number
  reason?: string | null
}
export interface WishlistRequest {
  retailStoreSeq: number
  productSeq: number
}
export interface SellerWishlist {
  seq: number
  retail_store_seq: number
  retail_store_name: string
  product_seq: number
  product_name: string
  image_url: string | null
  wholesale_store_seq: number
  wholesale_store_name: string
  price: number | null
  product_status: string
  created_at: string
}
export interface SellerBusinessResponse {
  businessProfiles: Array<{
    seq: number
    businessNumber: string
    companyName: string
    representativeName: string
    approvalStatus: string
    approvedAt: string | null
    stores: Array<{ seq: number; storeName: string; salesChannel: string | null; status: string }>
  }>
}
