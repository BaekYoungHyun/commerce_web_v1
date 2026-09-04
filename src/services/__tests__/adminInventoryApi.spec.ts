import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminInventoryApi } from '../adminInventoryApi'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const row = { seq: 1, variantSeq: 11, availableQuantity: 8, reservedQuantity: 2, totalQuantity: 10 }

describe('adminInventoryApi', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('Bearer 인증으로 도매 재고 목록을 조회한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json([row])); vi.stubGlobal('fetch', fetchMock)
    await expect(adminInventoryApi.list('token')).resolves.toEqual([row])
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/wholesale/inventory'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) }))
  })
  it('variant와 두 수량으로 재고를 등록한다', async () => {
    const body = { variantSeq: 11, availableQuantity: 8, reservedQuantity: 2 }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json(row, 201)); vi.stubGlobal('fetch', fetchMock)
    await adminInventoryApi.create('token', body)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/wholesale/inventory'), expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }))
  })
  it('inventorySeq 경로로 재고 전체를 PUT 수정한다', async () => {
    const body = { variantSeq: 11, availableQuantity: 5, reservedQuantity: 5 }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json({ ...row, ...body })); vi.stubGlobal('fetch', fetchMock)
    await adminInventoryApi.update('token', 1, body)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/wholesale/inventory/1'), expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) }))
  })
  it('신규와 기존 재고를 한 번의 벌크 요청으로 저장한다', async () => {
    const body = { items: [{ variantSeq: 12, availableQuantity: 9, reservedQuantity: 1 }, { seq: 1, variantSeq: 11, availableQuantity: 5, reservedQuantity: 5 }] }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json([row])); vi.stubGlobal('fetch', fetchMock)
    await adminInventoryApi.bulkUpsert('token', body)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/wholesale/inventory/bulk'), expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }))
  })
})
