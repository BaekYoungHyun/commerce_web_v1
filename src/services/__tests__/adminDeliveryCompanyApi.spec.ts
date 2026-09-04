import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminDeliveryCompanyApi } from '../adminDeliveryCompanyApi'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const company = { code: 'CJ', name: 'CJ대한통운', trackingUrlTemplate: null, active: true }

describe('adminDeliveryCompanyApi', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('Bearer 인증으로 택배사 목록을 조회한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json([company])); vi.stubGlobal('fetch', fetchMock)
    await expect(adminDeliveryCompanyApi.list('token')).resolves.toEqual([company])
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/admin/delivery-companies'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) }))
  })
  it('택배사 코드를 포함해 등록한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json(company, 201)); vi.stubGlobal('fetch', fetchMock)
    await adminDeliveryCompanyApi.create('token', company)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/admin/delivery-companies'), expect.objectContaining({ method: 'POST', body: JSON.stringify(company) }))
  })
  it('코드를 인코딩한 경로로 수정하며 body에는 코드를 넣지 않는다', async () => {
    const body = { name: '한진택배', trackingUrlTemplate: null, active: false }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(json({ code: 'HJ / 1', ...body })); vi.stubGlobal('fetch', fetchMock)
    await adminDeliveryCompanyApi.update('token', 'HJ / 1', body)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/admin/delivery-companies/HJ%20%2F%201'), expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) }))
  })
})
