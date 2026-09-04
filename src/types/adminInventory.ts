export interface AdminInventory {
  seq: number
  variantSeq: number
  sku: string | null
  color: string | null
  size: string | null
  variantStatus: string | null
  productSeq: number | null
  productName: string | null
  productStatus: string | null
  wholesaleStoreSeq: number | null
  wholesaleStoreName: string | null
  availableQuantity: number
  reservedQuantity: number
  totalQuantity: number
  updatedAt: string
}

export interface AdminInventoryRequest {
  variantSeq: number
  availableQuantity: number
  reservedQuantity: number
}

export interface AdminInventoryBulkItemRequest extends AdminInventoryRequest {
  seq?: number
}

export interface AdminInventoryBulkRequest {
  items: AdminInventoryBulkItemRequest[]
}
