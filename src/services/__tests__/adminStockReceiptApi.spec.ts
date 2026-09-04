import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminStockReceiptApi } from '../adminStockReceiptApi'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const row = { seq: 1, variantSeq: 10, quantity: 5, status: 'REGISTERED', memo: null }
describe('adminStockReceiptApi', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('Bearer 인증으로 도매 입고 목록을 조회한다', async () => { const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json([row])); vi.stubGlobal('fetch', fetchMock); await adminStockReceiptApi.list('token'); expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/wholesale/stock-receipts'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) })) })
  it('도매 입고 등록 요청에는 상태를 보내지 않는다', async () => { const body = { variantSeq: 10, quantity: 5, memo: null }; const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json(row, 201)); vi.stubGlobal('fetch', fetchMock); await adminStockReceiptApi.create('token', body); expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/wholesale/stock-receipts'), expect.objectContaining({ method: 'POST', body: JSON.stringify(body) })) })
  it('도매 입고 상태와 정보를 PUT으로 수정한다', async () => { const body = { variantSeq: 10, quantity: 4, memo: '입고 예정', status: 'EXPECTED' as const }; const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json({ ...row, ...body })); vi.stubGlobal('fetch', fetchMock); await adminStockReceiptApi.update('token', 1, body); expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/wholesale/stock-receipts/1'), expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) })) })
})
