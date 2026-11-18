export type OrderItemFulfillmentStatus = 'PRODUCT_ORDERED' | 'PRODUCT_PREPARING' | 'PRODUCT_READY'
export type ShipmentStatus = 'SHIPMENT_PREPARING' | 'SHIPPED'

export interface DeliveryCompanyOption {
  code: string
  name: string
  trackingUrlTemplate: string | null
}

export interface BulkOperationFailure {
  seq: number
  code: string
  message: string
}

export interface BulkOperationResponse<T> {
  succeeded: T[]
  failed: BulkOperationFailure[]
}

export interface OrderItemBulkStatusUpdateRequest {
  items: Array<{ orderSeq: number; orderItemSeq: number }>
  status: 'PRODUCT_PREPARING' | 'PRODUCT_READY'
}

export interface ShipmentBulkStatusUpdateRequest {
  shipments: Array<{
    shipmentSeq: number
    deliveryCompanyCode: string
    trackingNumber: string
  }>
  status: 'SHIPPED'
}

export interface WholesaleOwnedStore {
  seq: number
  businessProfileSeq: number
  businessProfileName: string | null
  userSeq: number | null
  userId: string | null
  userName: string | null
  storeName: string
  status: string
}

export interface WholesaleOrderItem {
  orderItemSeq: number
  wholesaleStoreSeq: number
  wholesaleStoreName: string | null
  productSeq: number
  variantSeq: number
  productName: string
  sku: string | null
  color: string | null
  size: string | null
  unitPrice: number
  quantity: number
  lineAmount: number
  status: OrderItemFulfillmentStatus
}

export interface WholesaleOrder {
  orderSeq: number
  orderNo: string
  status: string
  retailStoreSeq: number
  retailStoreName: string | null
  buyerCompanyName: string | null
  recipientName: string
  recipientPhone: string
  createdAt: string
  items: WholesaleOrderItem[]
}

export interface ShipmentItem {
  shipmentItemSeq: number
  orderItemSeq: number
  productSeq: number
  variantSeq: number
  productName: string
  sku: string | null
  color: string | null
  size: string | null
  orderedQuantity: number
  shipmentQuantity: number
}

export interface Shipment {
  shipmentSeq: number
  orderSeq: number
  orderNo: string
  wholesaleStoreSeq: number
  wholesaleStoreName: string | null
  deliveryCompanyCode: string | null
  trackingNumber: string | null
  status: ShipmentStatus
  shippedAt: string | null
  deliveredAt: string | null
  items: ShipmentItem[]
}

export interface FulfillmentFilters {
  page?: number
  size?: number
  wholesaleStoreSeq?: number
  status?: string
  keyword?: string
  orderedFrom?: string
  orderedTo?: string
}
