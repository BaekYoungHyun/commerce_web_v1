import { describe, expect, it } from 'vitest'
import { formatDateTime } from '../dateTime'

describe('formatDateTime', () => {
  it('오프셋 없는 서비스 일시는 밀리초를 제외하고 표시한다', () => {
    expect(formatDateTime('2026-08-18T10:20:30.123456')).toBe('2026-08-18 10:20:30')
  })

  it('오프셋이 있는 일시는 한국 시간으로 변환한다', () => {
    expect(formatDateTime('2026-08-18T01:20:30Z')).toBe('2026-08-18 10:20:30')
  })

  it('값이 없으면 대시를 표시한다', () => {
    expect(formatDateTime(null)).toBe('-')
  })
})
