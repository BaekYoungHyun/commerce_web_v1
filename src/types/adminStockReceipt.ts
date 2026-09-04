export type StockReceiptStatus = 'REGISTERED' | 'EXPECTED' | 'COMPLETED'

export interface AdminStockReceipt {
  seq: number
  variantSeq: number
  sku: string | null
  color: string | null
  size: string | null
  productSeq: number | null
  productName: string | null
  wholesaleStoreSeq: number | null
  wholesaleStoreName: string | null
  quantity: number
  status: StockReceiptStatus
  memo: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminStockReceiptCreateRequest {
  variantSeq: number
  quantity: number
  memo?: string | null
}

export interface AdminStockReceiptUpdateRequest extends AdminStockReceiptCreateRequest {
  status: StockReceiptStatus
}
