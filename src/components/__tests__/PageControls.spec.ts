import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PageControls from '../PageControls.vue'

describe('PageControls', () => {
  it('첫 페이지 묶음에 1부터 10까지 표시하고 0 기반 페이지를 전달한다', async () => {
    const wrapper = mount(PageControls, {
      props: { page: 0, size: 20, totalPages: 25, totalElements: 500 },
    })

    const pageButtons = wrapper.findAll('.admin-pagination-pages button')
    expect(pageButtons.map((button) => button.text())).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ])

    await pageButtons[4]!.trigger('click')
    expect(wrapper.emitted('change')).toEqual([[4]])
  })

  it('현재 페이지가 속한 10개 단위 묶음을 표시한다', () => {
    const wrapper = mount(PageControls, {
      props: { page: 12, size: 20, totalPages: 25, totalElements: 500 },
    })

    expect(
      wrapper.findAll('.admin-pagination-pages button').map((button) => button.text()),
    ).toEqual(['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('13')
  })

  it('마지막 묶음은 전체 페이지 수까지만 표시한다', () => {
    const wrapper = mount(PageControls, {
      props: { page: 20, size: 20, totalPages: 25, totalElements: 500 },
    })

    expect(
      wrapper.findAll('.admin-pagination-pages button').map((button) => button.text()),
    ).toEqual(['21', '22', '23', '24', '25'])
  })

  it('페이지 크기를 바꾸면 첫 페이지와 선택한 크기를 전달한다', async () => {
    const wrapper = mount(PageControls, {
      props: { page: 4, size: 20, totalPages: 25, totalElements: 500 },
    })

    await wrapper.get('.admin-pagination-size select').setValue('30')
    expect(wrapper.emitted('change')).toEqual([[0, 30]])
  })
})
