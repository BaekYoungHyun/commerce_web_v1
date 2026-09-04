export interface BusinessProfile {
  seq: number
  userSeq: number
  userId: string | null
  userName: string
  businessNumber: string
  companyName: string
  representativeName: string
  approvalStatus: string
  approvedAt: string | null
}

export interface BusinessProfileRequest {
  userSeq: number
  businessNumber: string
  companyName: string
  representativeName: string
  approvalStatus: string
  approvedAt: string | null
}

export interface WholesaleStore {
  seq: number
  businessProfileSeq: number
  companyName: string
  businessNumber: string
  storeName: string
  marketName: string | null
  floorRoom: string | null
  status: string
}

export interface WholesaleStoreRequest {
  businessProfileSeq: number
  storeName: string
  marketName: string | null
  floorRoom: string | null
  status: string
}

export interface RetailStore {
  seq: number
  businessProfileSeq: number
  companyName: string
  businessNumber: string
  storeName: string
  salesChannel: string | null
  status: string
}

export interface RetailStoreRequest {
  businessProfileSeq: number
  storeName: string
  salesChannel: string | null
  status: string
}

export type AdminBusinessResource = 'business-profiles' | 'wholesale-stores' | 'retail-stores'
export type AdminBusinessItem = BusinessProfile | WholesaleStore | RetailStore
export type AdminBusinessRequest = BusinessProfileRequest | WholesaleStoreRequest | RetailStoreRequest
