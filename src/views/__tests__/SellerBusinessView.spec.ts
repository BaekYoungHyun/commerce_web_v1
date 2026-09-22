import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import SellerBusinessView from '../SellerBusinessView.vue'
import { useAuthStore } from '../../stores/auth'
import { sellerAdminApi } from '../../services/sellerAdminApi'
import type { SellerBusinessResponse, SellerStoreMutationResponse } from '../../types/sellerAdmin'

const businessResponse: SellerBusinessResponse = {
  businessProfiles: [
    {
      seq: 9,
      businessNumber: '123-45-67890',
      companyName: '셀러 사업자',
      representativeName: '대표자',
      approvalStatus: 'APPROVED',
      approvedAt: null,
      stores: [
        {
          seq: 31,
          businessProfileSeq: 9,
          businessProfileName: '셀러 사업자',
          userSeq: 3,
          userId: 'seller1',
          userName: '대표자',
          storeName: '기존 매장',
          salesChannel: '온라인몰',
          status: 'ACTIVE',
        },
      ],
    },
  ],
}
const saved: SellerStoreMutationResponse = {
  seq: 32,
  businessProfileSeq: 9,
  storeName: '신규 매장',
  salesChannel: null,
  status: 'ACTIVE',
}
let wrapper: VueWrapper
const dialog = () => document.querySelector<HTMLDialogElement>('.seller-store-modal')!
const modalForm = () => new DOMWrapper(dialog().querySelector('form')!)

beforeEach(() => {
  setActivePinia(createPinia())
  vi.spyOn(useAuthStore(), 'getValidAccessToken').mockResolvedValue('test-token')
  vi.spyOn(sellerAdminApi, 'business').mockResolvedValue(businessResponse)
  vi.spyOn(sellerAdminApi, 'createStore').mockResolvedValue(saved)
  vi.spyOn(sellerAdminApi, 'updateStore').mockResolvedValue(saved)
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.setAttribute('open', '')
      },
    },
    close: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.removeAttribute('open')
        this.dispatchEvent(new Event('close'))
      },
    },
  })
})
afterEach(() => {
  wrapper?.unmount()
  vi.restoreAllMocks()
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

async function render() {
  wrapper = mount(SellerBusinessView, { attachTo: document.body })
  await flushPromises()
}

describe('셀러 사업자·매장 관리', () => {
  it('현재 사업자를 기본 선택해 레이어 팝업에서 매장을 등록한다', async () => {
    await render()
    await wrapper.get('.admin-page-heading button').trigger('click')
    expect(dialog().open).toBe(true)
    expect(modalForm().get('select').element.value).toBe('9')
    await modalForm().get('input[name="storeName"]').setValue(' 신규 매장 ')
    await modalForm().trigger('submit')
    await flushPromises()

    expect(sellerAdminApi.createStore).toHaveBeenCalledWith('test-token', {
      businessProfileSeq: 9,
      storeName: '신규 매장',
      salesChannel: null,
      status: 'ACTIVE',
    })
    expect(dialog().open).toBe(false)
    expect(sellerAdminApi.business).toHaveBeenCalledTimes(2)
  })

  it('수정은 사업자를 고정하고 storeSeq로 저장한다', async () => {
    await render()
    await wrapper.get('tbody button').trigger('click')
    expect(modalForm().get('select').attributes('disabled')).toBeDefined()
    await modalForm().get('input[maxlength="50"]').setValue('SNS')
    await modalForm().trigger('submit')
    await flushPromises()

    expect(sellerAdminApi.updateStore).toHaveBeenCalledWith('test-token', 31, {
      storeName: '기존 매장',
      salesChannel: 'SNS',
      status: 'ACTIVE',
    })
  })

  it('매장이 없어도 등록은 활성화하고 사업자가 없으면 비활성화한다', async () => {
    vi.mocked(sellerAdminApi.business).mockResolvedValueOnce({
      businessProfiles: [{ ...businessResponse.businessProfiles[0]!, stores: [] }],
    })
    await render()
    expect(wrapper.get('.admin-page-heading button').attributes('disabled')).toBeUndefined()
    wrapper.unmount()

    vi.mocked(sellerAdminApi.business).mockResolvedValueOnce({ businessProfiles: [] })
    await render()
    expect(wrapper.get('.admin-page-heading button').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('연결된 사업자가 없습니다')
  })
})
