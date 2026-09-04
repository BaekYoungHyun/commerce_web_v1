import { describe, expect, it } from 'vitest'
import { normalizeUserType, userTypeFromBusinessType, userTypeLabel } from '../userType'

describe('userType', () => {
  it('확정된 사용자 구분을 유지한다', () => {
    expect(normalizeUserType('WHOLESALE')).toBe('WHOLESALE')
    expect(normalizeUserType('ADMIN')).toBe('ADMIN')
  })

  it('필드가 없는 기존 사용자는 소매로 안전하게 처리한다', () => {
    expect(normalizeUserType(undefined)).toBe('RETAIL')
    expect(userTypeLabel(undefined)).toBe('소매')
  })

  it('현재 사용자 정보의 businessType으로 도매와 셀러를 구분한다', () => {
    expect(userTypeFromBusinessType('WHOLESALE')).toBe('WHOLESALE')
    expect(userTypeFromBusinessType('RETAIL')).toBe('RETAIL')
  })

  it('businessType이 없으면 기존 userType을 호환한다', () => {
    expect(userTypeFromBusinessType(undefined, 'ADMIN')).toBe('ADMIN')
    expect(userTypeFromBusinessType(undefined, 'WHOLESALE')).toBe('WHOLESALE')
  })
})
