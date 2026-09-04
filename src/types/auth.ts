import type { BusinessType, UserType } from './userType'

export type UserStatus = string

export interface User {
  seq: number
  userId: string | null
  phone: string
  name: string
  status: UserStatus
  businessType: BusinessType
  userType?: UserType
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SignUpRequest {
  userId: string
  passwd: string
  phone: string
  name: string
  businessType: BusinessType
}

export interface LoginRequest {
  userId: string
  passwd: string
}

export interface LoginResponse {
  grantType: 'Bearer'
  accessToken: string
  accessTokenExpiresIn: number
  businessType: BusinessType
  roles: Array<'RETAILER' | 'WHOLESALER' | 'ADMIN'>
  adminScopes: BusinessType[]
  landingPage: 'WHOLESALE_ADMIN' | 'SERVICE_MAIN' | 'ADMIN_HOME'
}
