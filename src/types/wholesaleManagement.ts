export interface WholesaleManagementDashboard {
  store_count: number
  product_count: number
  order_item_count: number
  low_stock_count: number
  requested_claim_count: number
}

export interface SettlementGenerateRequest {
  periodStart: string
  periodEnd: string
  wholesaleStoreSeq?: number
}

export interface WholesaleSettlement {
  seq: number
  wholesale_store_seq: number
  store_name: string
  period_start: string
  period_end: string
  gross_amount: number
  commission_amount: number
  payout_amount: number
  status: string
}

export type WholesaleClaimType = 'CANCEL' | 'RETURN'
export type WholesaleClaimStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
export type WholesaleClaimNextStatus = 'APPROVED' | 'REJECTED' | 'COMPLETED'

export interface WholesaleClaim {
  seq: number
  claim_type: WholesaleClaimType
  quantity: number
  reason: string | null
  status: WholesaleClaimStatus
  created_at: string
  processed_at: string | null
  order_item_seq: number
  product_name_snapshot: string
  order_seq: number
  order_no: string
  wholesale_store_seq: number
  store_name: string
}

export interface WholesaleClient {
  retail_store_seq: number
  store_name: string
  company_name: string
  order_count: number
  total_amount: number
  last_order_at: string
}

export interface WholesaleBusinessRow {
  business_profile_seq: number
  business_number: string
  company_name: string
  representative_name: string
  approval_status: string
  wholesale_store_seq: number | null
  store_name: string | null
  market_name: string | null
  floor_room: string | null
  store_status: 'ACTIVE' | 'INACTIVE' | null
}

export interface WholesaleStoreUpdateRequest {
  storeName: string
  marketName?: string | null
  floorRoom?: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export interface WholesaleStoreCreateRequest extends WholesaleStoreUpdateRequest {
  businessProfileSeq: number
}

export interface WholesaleStoreUpdateResponse {
  wholesale_store_seq: number
  store_name: string
  market_name: string | null
  floor_room: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export interface PayoutAccount {
  seq: number
  wholesale_store_seq: number
  store_name: string
  bank_name: string
  account_number: string
  account_holder: string
}

export interface PayoutAccountRequest {
  bankName: string
  accountNumber: string
  accountHolder: string
}
