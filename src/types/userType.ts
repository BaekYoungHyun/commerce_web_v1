export type UserType = 'WHOLESALE' | 'RETAIL' | 'ADMIN'
export type BusinessType = 'WHOLESALE' | 'RETAIL'

export const userTypes: Array<{ value: UserType; label: string }> = [
  { value: 'WHOLESALE', label: '도매' },
  { value: 'RETAIL', label: '소매' },
  { value: 'ADMIN', label: 'ADMIN' },
]

export function normalizeUserType(value: string | null | undefined): UserType {
  return userTypes.some((item) => item.value === value) ? value as UserType : 'RETAIL'
}

export function userTypeFromBusinessType(
  businessType: string | null | undefined,
  fallbackUserType?: string | null,
): UserType {
  if (businessType === 'WHOLESALE') return 'WHOLESALE'
  if (businessType === 'RETAIL') return 'RETAIL'
  return normalizeUserType(fallbackUserType)
}

export function userTypeLabel(value: string | null | undefined) {
  return userTypes.find((item) => item.value === normalizeUserType(value))?.label ?? '소매'
}
