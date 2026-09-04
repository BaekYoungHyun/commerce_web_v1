export const userStatuses = [
  { value: 'PENDING', label: '승인 대기' },
  { value: 'ACTIVE', label: '사용 중' },
  { value: 'SUSPENDED', label: '사용 중지' },
] as const

export const storeStatuses = [
  { value: 'ACTIVE', label: '운영 중' },
  { value: 'INACTIVE', label: '운영 종료' },
  { value: 'SUSPENDED', label: '운영 중지' },
] as const

export const approvalStatuses = [
  { value: 'PENDING', label: '승인 대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '승인 거절' },
] as const
