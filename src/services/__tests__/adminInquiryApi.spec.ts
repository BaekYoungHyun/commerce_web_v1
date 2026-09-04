import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminInquiryApi } from '../adminInquiryApi'

describe('adminInquiryApi', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('관리자 전체 문의 목록 필터와 페이지를 전송한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
          { status: 200 },
        ),
      )

    await adminInquiryApi.list('token', {
      page: 0,
      size: 20,
      keyword: '배송',
      status: 'OPEN',
      businessType: 'RETAIL',
    })

    const url = String(fetchMock.mock.calls[0]?.[0])
    expect(url).toContain('/admin/support/inquiries?')
    expect(url).toContain('keyword=%EB%B0%B0%EC%86%A1')
    expect(url).toContain('status=OPEN')
    expect(url).toContain('businessType=RETAIL')
  })

  it('답변과 상태 변경 API를 호출한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ seq: 3 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ seq: 3 }), { status: 200 }))

    await adminInquiryApi.answer('token', 3, { content: '확인했습니다.' })
    await adminInquiryApi.updateStatus('token', 3, 'CLOSED')

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/admin/support/inquiries/3/answer')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT' })
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/admin/support/inquiries/3/status')
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'PATCH' })
  })
})
