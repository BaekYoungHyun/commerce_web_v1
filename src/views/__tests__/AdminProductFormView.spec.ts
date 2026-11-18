import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import AdminProductFormView from '../AdminProductFormView.vue'
import { useAdminProductsStore } from '../../stores/adminProducts'
import { useCategoriesStore } from '../../stores/categories'
import { useWholesaleFulfillmentStore } from '../../stores/wholesaleFulfillment'
import type { AdminProduct } from '../../types/adminProduct'

const navigation = vi.hoisted(() => ({
  route: {
    name: 'supplier-admin-product-new',
    params: { id: '12' },
    fullPath: '/admin/supplier/products/new',
  },
  push: vi.fn<(to: unknown) => Promise<void>>(),
  replace: vi.fn<(to: unknown) => Promise<void>>(),
}))
vi.mock('vue-router', () => ({
  useRoute: () => navigation.route,
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
}))

const product: AdminProduct = {
  seq: 12,
  wholesaleStoreSeq: 42,
  wholesaleStoreName: '소유 매장',
  categorySeq: 8,
  name: '테스트 상품',
  description: null,
  status: 'DRAFT',
  minOrderQuantity: 1,
  createdAt: '',
  updatedAt: '',
  images: [],
  options: [],
  variants: [],
  totalStockQuantity: 0,
  viewCount: 0,
}
const ownedStore = {
  seq: 42,
  businessProfileSeq: 900,
  businessProfileName: '사업자',
  userSeq: 1,
  userId: null,
  userName: null,
  storeName: '소유 매장',
  status: 'ACTIVE',
}
const render = () => mount(AdminProductFormView, { global: { stubs: { RouterLink: true } } })

beforeEach(() => {
  setActivePinia(createPinia())
  navigation.route.name = 'supplier-admin-product-new'
  vi.clearAllMocks()
  useCategoriesStore().categories = [
    {
      seq: 8,
      parentSeq: null,
      depth: 1,
      code: 'TEST',
      name: '테스트 분류',
      sortOrder: 0,
      isActive: true,
      children: [],
    },
  ]
  vi.spyOn(useCategoriesStore(), 'fetchCategories').mockResolvedValue([])
  vi.spyOn(useWholesaleFulfillmentStore(), 'fetchStores').mockResolvedValue([ownedStore])
  vi.spyOn(useAdminProductsStore(), 'fetchProduct').mockResolvedValue(product)
  vi.spyOn(useAdminProductsStore(), 'createProduct').mockResolvedValue(product)
  vi.spyOn(useAdminProductsStore(), 'updateProduct').mockResolvedValue(product)
})

describe('도매 상품 매장 선택', () => {
  it('등록 시 매장 SEQ를 전송하고 사업자 SEQ를 전송하지 않는다', async () => {
    const wrapper = render()
    await flushPromises()
    const select = wrapper.findAll('select')[0]!
    expect(select.text()).toContain('소유 매장 (매장 SEQ 42)')
    await select.setValue('42')
    const category = wrapper.findAll('select')[1]!
    await category.setValue('8')
    await wrapper.get('input[maxlength="200"]').setValue('상품')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(useAdminProductsStore().createProduct).toHaveBeenCalledWith(
      expect.objectContaining({ wholesaleStoreSeq: 42 }),
    )
    expect(useAdminProductsStore().createProduct).not.toHaveBeenCalledWith(
      expect.objectContaining({ wholesaleStoreSeq: 900 }),
    )
  })

  it('수정 시 기존 매장의 선택을 유지한다', async () => {
    navigation.route.name = 'supplier-admin-product-edit'
    const wrapper = render()
    await flushPromises()
    expect(wrapper.findAll('select')[0]!.element.value).toBe('42')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(useAdminProductsStore().updateProduct).toHaveBeenCalledWith(
      12,
      expect.objectContaining({ wholesaleStoreSeq: 42 }),
    )
  })

  it('매장 조회 실패 시 오류를 표시하고 저장을 차단한다', async () => {
    vi.mocked(useWholesaleFulfillmentStore().fetchStores).mockRejectedValue(new Error('조회 실패'))
    const wrapper = render()
    await flushPromises()
    expect(wrapper.text()).toContain('조회 실패')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    expect(useAdminProductsStore().createProduct).not.toHaveBeenCalled()
  })

  it('소유 매장 목록에 없는 기존 매장을 임의 변경하지 않고 저장을 막는다', async () => {
    navigation.route.name = 'supplier-admin-product-edit'
    vi.mocked(useWholesaleFulfillmentStore().fetchStores).mockResolvedValue([])
    const wrapper = render()
    await flushPromises()
    expect(wrapper.text()).toContain('기존 매장 SEQ 42 (선택 목록에 없음)')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    expect(useAdminProductsStore().updateProduct).not.toHaveBeenCalled()
  })
})
