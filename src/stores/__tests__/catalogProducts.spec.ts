import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { productApi } from '../../services/productApi'
import { useAuthStore } from '../auth'
import { useCatalogProductsStore } from '../catalogProducts'

describe('catalogProducts store', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    useAuthStore().accessToken = 'access-token'
  })

  it('카테고리와 상품명 조건으로 서버 상품 페이지를 조회한다', async () => {
    const page = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
    const list = vi.spyOn(productApi, 'list').mockResolvedValue(page)
    const store = useCatalogProductsStore()

    await expect(store.fetchProducts({ page: 0, size: 20, categorySeq: 8, name: '셔츠' })).resolves.toEqual(page)
    expect(list).toHaveBeenCalledWith('access-token', { page: 0, size: 20, categorySeq: 8, name: '셔츠' })
  })

  it('상품 상세를 서버에서 조회해 현재 상품에 저장한다', async () => {
    const product = {
      seq: 31,
      wholesaleStoreSeq: 2,
      wholesaleStoreName: '테스트 도매상',
      categorySeq: 8,
      name: '도매 셔츠',
      description: '상품 설명',
      status: 'ACTIVE',
      minOrderQuantity: 5,
      createdAt: '2026-07-31T10:00:00',
      updatedAt: '2026-07-31T10:00:00',
      images: [],
      options: [],
      variants: [],
      viewCount: 12,
    }
    const detail = vi
      .spyOn(productApi, 'detail')
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce({ ...product, viewCount: 13 })
    const createView = vi.spyOn(productApi, 'createView').mockResolvedValue({
      seq: 1,
      userId: null,
      productSeq: 31,
      viewedAt: '2026-07-31T10:01:00+09:00',
    })
    const store = useCatalogProductsStore()

    await expect(store.fetchProduct(31)).resolves.toEqual({ ...product, viewCount: 13 })
    expect(detail).toHaveBeenCalledTimes(2)
    expect(detail).toHaveBeenNthCalledWith(1, 'access-token', 31)
    expect(createView).toHaveBeenCalledWith('access-token', 31, { userId: null })
    expect(store.currentProduct?.viewCount).toBe(13)
  })
})
