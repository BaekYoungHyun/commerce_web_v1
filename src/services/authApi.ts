import type { ApiResponse } from './httpClient'
import { apiRequest } from './httpClient'
import type { LoginRequest, LoginResponse, SignUpRequest, User } from '../types/auth'

type UserApiResponse = Omit<User, 'passwd'> & { passwd?: string | null }

const withoutPassword = ({ passwd: _passwd, ...user }: UserApiResponse): User => user
const bearerHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
})

export const authApi = {
  async signUp(payload: SignUpRequest): Promise<User> {
    const response = await apiRequest<ApiResponse<UserApiResponse>>('/users/sign', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return withoutPassword(response.data)
  },

  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiRequest<ApiResponse<LoginResponse>>('/users/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return response.data
  },

  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await apiRequest<ApiResponse<UserApiResponse>>('/users/info', {
      headers: bearerHeaders(accessToken),
    })
    return withoutPassword(response.data)
  },

  async refreshToken(accessToken: string): Promise<LoginResponse> {
    const response = await apiRequest<ApiResponse<LoginResponse>>('/users/refresh-token', {
      method: 'POST',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify({}),
    })
    return response.data
  },

  async logout(accessToken: string): Promise<void> {
    await apiRequest<ApiResponse<unknown>>('/users/logout', {
      method: 'POST',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify({}),
    })
  },
}
