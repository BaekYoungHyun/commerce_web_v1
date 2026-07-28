export type UserStatus = string

export interface User {
  seq: number
  userId: string | null
  phone: string
  name: string
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SignUpRequest {
  userId: string
  passwd: string
  phone: string
  name: string
}

export interface LoginRequest {
  userId: string
  passwd: string
}

export interface LoginResponse {
  grantType: 'Bearer'
  accessToken: string
  accessTokenExpiresIn: number
}
