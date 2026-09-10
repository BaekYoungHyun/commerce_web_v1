import { afterEach, describe, expect, it, vi } from 'vitest'
import { wholesaleManagementApi } from '../wholesaleManagementApi'

describe('wholesaleManagementApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('상태 조건으로 클레임을 조회한다', async () => {
    const claim = { seq: 4, claim_type: 'RETURN', quantity: 1, reason: null, status: 'REQUESTED' }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([claim]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(wholesaleManagementApi.claims('token', 'REQUESTED')).resolves.toEqual([claim])
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      '/wholesale/management/claims?status=REQUESTED',
    )
  })

  it('허용된 다음 클레임 상태를 PATCH 요청한다', async () => {
    const updated = { seq: 4, status: 'APPROVED' }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(updated), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(wholesaleManagementApi.updateClaimStatus('token', 4, 'APPROVED')).resolves.toEqual(
      updated,
    )
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/wholesale/management/claims/4/status'),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }) }),
    )
  })

  it('정산 기간과 선택 매장으로 정산 산출을 요청한다', async () => {
    const body = { periodStart: '2026-09-01', periodEnd: '2026-09-07', wholesaleStoreSeq: 3 }
    const settlement = {
      seq: 1,
      wholesale_store_seq: 3,
      store_name: '도매 매장',
      period_start: '2026-09-01',
      period_end: '2026-09-07',
      gross_amount: 10000,
      commission_amount: 0,
      payout_amount: 10000,
      status: 'READY',
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([settlement]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(wholesaleManagementApi.generateSettlements('token', body)).resolves.toEqual([
      settlement,
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/wholesale/management/settlements/generate'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }),
    )
  })

  it('거래처와 사업자 정보를 조회하고 소유 매장을 수정한다', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            wholesale_store_seq: 3,
            store_name: '수정 매장',
            market_name: null,
            floor_room: null,
            status: 'ACTIVE',
          }),
          { status: 200 },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    await wholesaleManagementApi.clients('token')
    await wholesaleManagementApi.business('token')
    await wholesaleManagementApi.updateStore('token', 3, {
      storeName: '수정 매장',
      status: 'ACTIVE',
    })
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/wholesale/management/clients')
    expect(String(fetchMock.mock.calls[1]![0])).toContain('/wholesale/management/business')
    expect(fetchMock.mock.calls[2]![1]).toEqual(
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ storeName: '수정 매장', status: 'ACTIVE' }),
      }),
    )
  })

  it('정산계좌를 조회하고 저장한다', async () => {
    const account = {
      seq: 1,
      wholesale_store_seq: 3,
      store_name: '도매',
      bank_name: '은행',
      account_number: '123',
      account_holder: '홍길동',
    }
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([account]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(account), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(wholesaleManagementApi.payoutAccounts('token')).resolves.toEqual([account])
    const body = { bankName: '은행', accountNumber: '123', accountHolder: '홍길동' }
    await wholesaleManagementApi.savePayoutAccount('token', 3, body)
    expect(fetchMock.mock.calls[1]![1]).toEqual(
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) }),
    )
  })
})
