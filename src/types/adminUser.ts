import type { BusinessType } from './userType'

export type AdminUserRole = 'RETAILER' | 'WHOLESALER' | 'ADMIN'

export interface AdminUser {
  seq: number
  userId: string
  phone: string
  name: string
  status: string
  businessType: BusinessType
  role: AdminUserRole
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminUserCreateRequest {
  userId: string
  passwd: string
  phone: string
  name: string
  status: string
  businessType: BusinessType
  role: AdminUserRole
}

export interface AdminUserUpdateRequest {
  userId: string
  passwd?: string
  phone: string
  name: string
  status: string
  businessType: BusinessType
  role: AdminUserRole
}
