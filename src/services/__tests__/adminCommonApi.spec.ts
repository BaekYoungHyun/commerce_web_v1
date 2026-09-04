import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminCommonApi } from '../adminCommonApi'

describe('adminCommonApi', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('내 문의 목록과 등록 API를 호출한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ seq: 1 }), { status: 201 }))

    await adminCommonApi.inquiries('token')
    await adminCommonApi.createInquiry('token', {
      category: '주문',
      title: '문의',
      content: '내용',
    })

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/support/inquiries')
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'POST' })
  })

  it('알림 목록과 읽음 처리 API를 호출한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ seq: 3 }), { status: 200 }))

    await adminCommonApi.notifications('token')
    await adminCommonApi.readNotification('token', 3)

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/notifications')
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/notifications/3/read')
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'PATCH' })
  })
})
