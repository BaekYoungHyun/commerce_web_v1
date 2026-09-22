import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import WholesaleBusinessView from '../WholesaleBusinessView.vue'
import { useAuthStore } from '../../stores/auth'
import { wholesaleManagementApi } from '../../services/wholesaleManagementApi'
import type {
  WholesaleBusinessRow,
  WholesaleStoreUpdateResponse,
} from '../../types/wholesaleManagement'

const row: WholesaleBusinessRow = {
  business_profile_seq: 9,
  business_number: 'TEST-001',
  company_name: '테스트 사업자',
  representative_name: '대표자',
  approval_status: 'APPROVED',
  wholesale_store_seq: 42,
  store_name: '기존 매장',
  market_name: null,
  floor_room: null,
  store_status: 'ACTIVE',
}
const response: WholesaleStoreUpdateResponse = {
  wholesale_store_seq: 42,
  store_name: '매장',
  market_name: null,
  floor_room: null,
  status: 'ACTIVE',
}
let wrapper: VueWrapper
const render = async () => {
  wrapper = mount(WholesaleBusinessView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: true } },
  })
  await flushPromises()
  return wrapper
}
const dialog = () => {
  const dialogs = document.querySelectorAll<HTMLDialogElement>('dialog')
  return dialogs[dialogs.length - 1]!
}
const modalForm = () => new DOMWrapper(dialog().querySelector('form')!)
const registerButton = () => wrapper.get('.admin-page-heading button')

beforeEach(() => {
  setActivePinia(createPinia())
  vi.spyOn(useAuthStore(), 'getValidAccessToken').mockResolvedValue('test-token')
  vi.spyOn(wholesaleManagementApi, 'business').mockResolvedValue([
    row,
    { ...row, wholesale_store_seq: 43 },
  ])
  vi.spyOn(wholesaleManagementApi, 'createStore').mockResolvedValue(response)
  vi.spyOn(wholesaleManagementApi, 'updateStore').mockResolvedValue(response)
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

describe('도매 사업자·매장 등록·수정 팝업', () => {
  it('등록 팝업에서 사업자를 중복 제거해 표시하고 매장을 등록한다', async () => {
    await render()
    await registerButton().trigger('click')
    expect(dialog().open).toBe(true)
    expect(modalForm().findAll('select')[0]!.findAll('option')).toHaveLength(2)
    await modalForm().get('input[maxlength="150"]').setValue(' 신규 매장 ')
    await modalForm().trigger('submit')
    await flushPromises()
    expect(wholesaleManagementApi.createStore).toHaveBeenCalledWith('test-token', {
      businessProfileSeq: 9,
      storeName: '신규 매장',
      marketName: null,
      floorRoom: null,
      status: 'ACTIVE',
    })
    expect(dialog().open).toBe(false)
    expect(wholesaleManagementApi.business).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('매장이 등록되었습니다.')
  })

  it('수정 팝업은 사업자 연결을 고정하고 기존 매장 SEQ로 저장한다', async () => {
    await render()
    await wrapper.findAll('tbody button')[0]!.trigger('click')
    expect(modalForm().findAll('select')[0]!.attributes('disabled')).toBeDefined()
    expect((modalForm().get('input[maxlength="150"]').element as HTMLInputElement).value).toBe(
      '기존 매장',
    )
    await modalForm().get('input[maxlength="50"]').setValue('2층')
    await modalForm().trigger('submit')
    await flushPromises()
    expect(wholesaleManagementApi.updateStore).toHaveBeenCalledWith(
      'test-token',
      42,
      expect.objectContaining({ floorRoom: '2층' }),
    )
    expect(wholesaleManagementApi.createStore).not.toHaveBeenCalled()
  })

  it('저장 실패 시 팝업과 입력값을 유지한다', async () => {
    vi.mocked(wholesaleManagementApi.createStore).mockRejectedValue(new Error('등록 실패'))
    await render()
    await registerButton().trigger('click')
    await modalForm().get('input[maxlength="150"]').setValue('유지할 이름')
    await modalForm().trigger('submit')
    await flushPromises()
    expect(dialog().open).toBe(true)
    expect(modalForm().text()).toContain('등록 실패')
    expect((modalForm().get('input[maxlength="150"]').element as HTMLInputElement).value).toBe(
      '유지할 이름',
    )
  })

  it('저장 중 중복 제출과 Escape 닫기를 막는다', async () => {
    let resolveSave!: (value: WholesaleStoreUpdateResponse) => void
    vi.mocked(wholesaleManagementApi.createStore).mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve
      }),
    )
    await render()
    await registerButton().trigger('click')
    await modalForm().get('input[maxlength="150"]').setValue('매장')
    await modalForm().trigger('submit')
    await flushPromises()
    await modalForm().trigger('submit')
    dialog().dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(dialog().open).toBe(true)
    expect(wholesaleManagementApi.createStore).toHaveBeenCalledTimes(1)
    resolveSave(response)
    await flushPromises()
    expect(dialog().open).toBe(false)
  })

  it('매장 없는 사업자 행에서도 등록 팝업을 연다', async () => {
    vi.mocked(wholesaleManagementApi.business).mockResolvedValue([
      { ...row, wholesale_store_seq: null, store_name: null },
    ])
    await render()
    await wrapper.get('tbody button').trigger('click')
    expect(dialog().open).toBe(true)
    expect(modalForm().findAll('select')[0]!.element.value).toBe('9')
  })

  it('사업자 조회 실패 시 등록을 차단한다', async () => {
    vi.mocked(wholesaleManagementApi.business).mockRejectedValue(new Error('조회 실패'))
    await render()
    expect(registerButton().attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('조회 실패')
  })

  it('저장 성공 후 목록 재조회 실패를 등록 실패로 표시하지 않는다', async () => {
    vi.mocked(wholesaleManagementApi.business)
      .mockResolvedValueOnce([row])
      .mockRejectedValueOnce(new Error('목록 재조회 실패'))
    await render()
    await registerButton().trigger('click')
    await modalForm().get('input[maxlength="150"]').setValue('매장')
    await modalForm().trigger('submit')
    await flushPromises()
    expect(dialog().open).toBe(false)
    expect(wrapper.text()).toContain('매장이 등록되었습니다.')
    expect(wrapper.text()).toContain('목록 재조회 실패')
    expect(wholesaleManagementApi.createStore).toHaveBeenCalledTimes(1)
  })
})
