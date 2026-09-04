import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { productApi } from '../../services/productApi'
import { useAdminProductsStore } from '../adminProducts'
import { useAuthStore } from '../auth'
import type { AdminProduct } from '../../types/adminProduct'

const product: AdminProduct = {
  seq: 11,
  wholesaleStoreSeq: 10,
  wholesaleStoreName: '테스트 도매상',
  categorySeq: 3,
  name: '기본 셔츠',
  description: '상품 상세 설명',
  status: 'DRAFT',
  minOrderQuantity: 2,
  createdAt: '2026-07-25T10:30:00+09:00',
  updatedAt: '2026-07-25T10:30:00+09:00',
  images: [],
  options: [],
  variants: [],
  viewCount: 0,
}

describe('adminProducts store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    useAuthStore().accessToken = 'access-token'
  })

  it('상품 상세를 API에서 조회해 현재 상품에 반영한다', async () => {
    vi.spyOn(productApi, 'detail').mockResolvedValue(product)
    const store = useAdminProductsStore()

    await expect(store.fetchProduct(11)).resolves.toEqual(product)
    expect(store.currentProduct).toEqual(product)
    expect(productApi.detail).toHaveBeenCalledWith('access-token', 11)
  })

  it('상품 등록과 수정 요청을 API에 전달한다', async () => {
    const create = vi.spyOn(productApi, 'create').mockResolvedValue(product)
    const update = vi.spyOn(productApi, 'update').mockResolvedValue({ ...product, name: '수정 셔츠' })
    const store = useAdminProductsStore()
    const payload = {
      wholesaleStoreSeq: 10,
      categorySeq: 3,
      name: '기본 셔츠',
      description: '상품 상세 설명',
      status: 'DRAFT',
      minOrderQuantity: 2,
      images: [],
      options: [],
      variants: [],
    }

    await store.createProduct(payload)
    await store.updateProduct(11, { ...payload, name: '수정 셔츠' })

    expect(create).toHaveBeenCalledWith('access-token', payload)
    expect(update).toHaveBeenCalledWith('access-token', 11, { ...payload, name: '수정 셔츠' })
  })
})
