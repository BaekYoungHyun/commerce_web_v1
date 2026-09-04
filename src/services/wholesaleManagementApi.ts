import { apiRequest } from './httpClient'
import type { WholesaleManagementDashboard } from '../types/wholesaleManagement'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })

export const wholesaleManagementApi = {
  dashboard: (token: string) =>
    apiRequest<WholesaleManagementDashboard>('/wholesale/management/dashboard', {
      headers: headers(token),
    }),
}
