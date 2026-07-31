import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { productApi } from '../services/productApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { AdminProduct, AdminProductListParams, AdminProductPage } from '../types/adminProduct'

const emptyPage = (): AdminProductPage => ({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })

export const useCatalogProductsStore = defineStore('catalogProducts', () => {
  const authStore = useAuthStore()
  const pageData = ref<AdminProductPage>(emptyPage())
  const loading = ref(false)
  const error = ref('')
  const currentProduct = ref<AdminProduct | null>(null)
  const detailLoading = ref(false)
  const detailError = ref('')
  const viewError = ref('')
  const products = computed(() => pageData.value.content)

  async function fetchProducts(params: AdminProductListParams = {}) {
    loading.value = true
    error.value = ''
    try {
      try {
        pageData.value = await productApi.list(await authStore.getValidAccessToken(), params)
      } catch (cause) {
        if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
        pageData.value = await productApi.list(await authStore.refreshAccessToken(), params)
      }
      return pageData.value
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '상품을 불러오지 못했습니다.'
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(productId: number) {
    detailLoading.value = true
    detailError.value = ''
    viewError.value = ''
    currentProduct.value = null
    try {
      let accessToken = await authStore.getValidAccessToken()
      try {
        currentProduct.value = await productApi.detail(accessToken, productId)
      } catch (cause) {
        if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
        accessToken = await authStore.refreshAccessToken()
        currentProduct.value = await productApi.detail(accessToken, productId)
      }

      try {
        try {
          await productApi.createView(accessToken, productId, {
            userId: authStore.user?.seq ?? null,
          })
        } catch (cause) {
          if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
          accessToken = await authStore.refreshAccessToken()
          await productApi.createView(accessToken, productId, {
            userId: authStore.user?.seq ?? null,
          })
        }
      } catch (cause) {
        viewError.value = cause instanceof Error ? cause.message : '조회수를 기록하지 못했습니다.'
        return currentProduct.value
      }

      try {
        try {
          currentProduct.value = await productApi.detail(accessToken, productId)
        } catch (cause) {
          if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
          accessToken = await authStore.refreshAccessToken()
          currentProduct.value = await productApi.detail(accessToken, productId)
        }
      } catch (cause) {
        viewError.value =
          cause instanceof Error ? cause.message : '최신 조회수를 불러오지 못했습니다.'
      }
      return currentProduct.value
    } catch (cause) {
      detailError.value = cause instanceof Error ? cause.message : '상품 상세 정보를 불러오지 못했습니다.'
      throw cause
    } finally {
      detailLoading.value = false
    }
  }

  return {
    pageData,
    products,
    loading,
    error,
    currentProduct,
    detailLoading,
    detailError,
    viewError,
    fetchProducts,
    fetchProduct,
  }
})
