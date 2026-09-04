export interface AdminDeliveryCompany {
  code: string
  name: string
  trackingUrlTemplate: string | null
  active: boolean
}

export interface AdminDeliveryCompanyCreateRequest {
  code: string
  name: string
  trackingUrlTemplate?: string | null
  active: boolean
}

export interface AdminDeliveryCompanyUpdateRequest {
  name: string
  trackingUrlTemplate?: string | null
  active: boolean
}
