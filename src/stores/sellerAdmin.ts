import { ref } from 'vue'
import { defineStore } from 'pinia'
import { sellerAdminApi } from '../services/sellerAdminApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type {
  RefundRequest,
  SellerAddress,
  SellerAddressRequest,
  SellerBusinessResponse,
  SellerDashboard,
  SellerPayment,
  SellerWishlist,
  WishlistRequest,
} from '../types/sellerAdmin'

export const useSellerAdminStore = defineStore('sellerAdmin', () => {
  const auth = useAuthStore()
  const dashboard = ref<SellerDashboard | null>(null)
  const addresses = ref<SellerAddress[]>([])
  const payments = ref<SellerPayment[]>([])
  const wishlists = ref<SellerWishlist[]>([])
  const business = ref<SellerBusinessResponse | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  async function authorized<T>(request: (token: string) => Promise<T>) {
    try {
      return await request(await auth.getValidAccessToken())
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      return request(await auth.refreshAccessToken())
    }
  }
  async function run<T>(request: () => Promise<T>, fallback: string) {
    loading.value = true
    error.value = ''
    try {
      return await request()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : fallback
      throw cause
    } finally {
      loading.value = false
    }
  }
  const fetchDashboard = () =>
    run(
      async () => (dashboard.value = await authorized(sellerAdminApi.dashboard)),
      '대시보드를 불러오지 못했습니다.',
    )
  const fetchAddresses = () =>
    run(
      async () => (addresses.value = await authorized(sellerAdminApi.addresses)),
      '배송지를 불러오지 못했습니다.',
    )
  const fetchPayments = () =>
    run(
      async () => (payments.value = await authorized(sellerAdminApi.payments)),
      '결제 내역을 불러오지 못했습니다.',
    )
  const fetchWishlists = () =>
    run(
      async () => (wishlists.value = await authorized(sellerAdminApi.wishlists)),
      '찜 상품을 불러오지 못했습니다.',
    )
  const fetchBusiness = () =>
    run(
      async () => (business.value = await authorized(sellerAdminApi.business)),
      '사업자 정보를 불러오지 못했습니다.',
    )
  async function addWishlist(body: WishlistRequest) {
    const created = await authorized((token) => sellerAdminApi.addWishlist(token, body))
    wishlists.value.unshift(created)
    return created
  }
  async function removeWishlist(seq: number) {
    await authorized((token) => sellerAdminApi.deleteWishlist(token, seq))
    wishlists.value = wishlists.value.filter((item) => item.seq !== seq)
  }
  async function saveAddress(body: SellerAddressRequest, seq?: number) {
    saving.value = true
    error.value = ''
    try {
      const saved = await authorized((token) =>
        seq
          ? sellerAdminApi.updateAddress(token, seq, body)
          : sellerAdminApi.createAddress(token, body),
      )
      await fetchAddresses()
      return saved
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '배송지를 저장하지 못했습니다.'
      throw cause
    } finally {
      saving.value = false
    }
  }
  async function removeAddress(seq: number) {
    await authorized((token) => sellerAdminApi.deleteAddress(token, seq))
    await fetchAddresses()
  }
  async function requestRefund(body: RefundRequest) {
    saving.value = true
    error.value = ''
    try {
      await authorized((token) => sellerAdminApi.requestRefund(token, body))
      await fetchPayments()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '환불을 요청하지 못했습니다.'
      throw cause
    } finally {
      saving.value = false
    }
  }
  return {
    dashboard,
    addresses,
    payments,
    wishlists,
    business,
    loading,
    saving,
    error,
    fetchDashboard,
    fetchAddresses,
    fetchPayments,
    fetchWishlists,
    fetchBusiness,
    addWishlist,
    removeWishlist,
    saveAddress,
    removeAddress,
    requestRefund,
  }
})
