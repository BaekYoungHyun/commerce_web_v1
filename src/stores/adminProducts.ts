import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { productApi } from '../services/productApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type {
  AdminProduct,
  AdminProductCreateRequest,
  AdminProductListParams,
  AdminProductPage,
  AdminProductUpdateRequest,
} from '../types/adminProduct'

const emptyPage = (): AdminProductPage => ({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })

export const useAdminProductsStore = defineStore('adminProducts', () => {
  const authStore = useAuthStore()
  const pageData = ref<AdminProductPage>(emptyPage())
  const currentProduct = ref<AdminProduct | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const fieldErrors = ref<Record<string, string>>({})
  const products = computed(() => pageData.value.content)

  async function authorized<T>(request: (accessToken: string) => Promise<T>) {
    try {
      return await request(await authStore.getValidAccessToken())
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
      const refreshedToken = await authStore.refreshAccessToken()
      return request(refreshedToken)
    }
  }

  function applyError(cause: unknown, fallback: string) {
    error.value = cause instanceof Error ? cause.message : fallback
    fieldErrors.value = cause instanceof ApiError ? cause.fieldErrors : {}
  }

  async function fetchProducts(params: AdminProductListParams = {}) {
    loading.value = true
    error.value = ''
    try {
      pageData.value = await authorized((token) => productApi.list(token, params))
      return pageData.value
    } catch (cause) {
      applyError(cause, '상품 목록을 불러오지 못했습니다.')
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(id: number) {
    loading.value = true
    error.value = ''
    try {
      currentProduct.value = await authorized((token) => productApi.detail(token, id))
      return currentProduct.value
    } catch (cause) {
      currentProduct.value = null
      applyError(cause, '상품 정보를 불러오지 못했습니다.')
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function createProduct(payload: AdminProductCreateRequest) {
    saving.value = true
    error.value = ''
    fieldErrors.value = {}
    try {
      const product = await authorized((token) => productApi.create(token, payload))
      currentProduct.value = product
      return product
    } catch (cause) {
      applyError(cause, '상품을 등록하지 못했습니다.')
      throw cause
    } finally {
      saving.value = false
    }
  }

  async function updateProduct(id: number, payload: AdminProductUpdateRequest) {
    saving.value = true
    error.value = ''
    fieldErrors.value = {}
    try {
      const product = await authorized((token) => productApi.update(token, id, payload))
      currentProduct.value = product
      return product
    } catch (cause) {
      applyError(cause, '상품을 수정하지 못했습니다.')
      throw cause
    } finally {
      saving.value = false
    }
  }

  return {
    pageData,
    products,
    currentProduct,
    loading,
    saving,
    error,
    fieldErrors,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
  }
})
