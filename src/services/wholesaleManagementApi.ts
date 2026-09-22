import { apiRequest } from './httpClient'
import type {
  SettlementGenerateRequest,
  PayoutAccount,
  PayoutAccountRequest,
  WholesaleClaim,
  WholesaleClaimNextStatus,
  WholesaleClaimStatus,
  WholesaleManagementDashboard,
  WholesaleBusinessRow,
  WholesaleClient,
  WholesaleStoreUpdateRequest,
  WholesaleStoreCreateRequest,
  WholesaleStoreUpdateResponse,
  WholesaleSettlement,
} from '../types/wholesaleManagement'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })

export const wholesaleManagementApi = {
  dashboard: (token: string) =>
    apiRequest<WholesaleManagementDashboard>('/wholesale/management/dashboard', {
      headers: headers(token),
    }),
  claims: (token: string, status?: WholesaleClaimStatus) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    return apiRequest<WholesaleClaim[]>(`/wholesale/management/claims${query}`, {
      headers: headers(token),
    })
  },
  updateClaimStatus: (token: string, seq: number, status: WholesaleClaimNextStatus) =>
    apiRequest<WholesaleClaim>(`/wholesale/management/claims/${seq}/status`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ status }),
    }),
  settlements: (token: string) =>
    apiRequest<WholesaleSettlement[]>('/wholesale/management/settlements', {
      headers: headers(token),
    }),
  generateSettlements: (token: string, body: SettlementGenerateRequest) =>
    apiRequest<WholesaleSettlement[]>('/wholesale/management/settlements/generate', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    }),
  payoutAccounts: (token: string) =>
    apiRequest<PayoutAccount[]>('/wholesale/management/payout-accounts', {
      headers: headers(token),
    }),
  savePayoutAccount: (token: string, storeSeq: number, body: PayoutAccountRequest) =>
    apiRequest<PayoutAccount>(`/wholesale/management/payout-accounts/${storeSeq}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(body),
    }),
  clients: (token: string) =>
    apiRequest<WholesaleClient[]>('/wholesale/management/clients', {
      headers: headers(token),
    }),
  business: (token: string) =>
    apiRequest<WholesaleBusinessRow[]>('/wholesale/management/business', {
      headers: headers(token),
    }),
  updateStore: (token: string, storeSeq: number, body: WholesaleStoreUpdateRequest) =>
    apiRequest<WholesaleStoreUpdateResponse>(`/wholesale/management/stores/${storeSeq}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(body),
    }),
  createStore: (token: string, body: WholesaleStoreCreateRequest) =>
    apiRequest<WholesaleStoreUpdateResponse>('/wholesale/management/stores', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    }),
}
