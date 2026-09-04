export const productStatuses = [
  { value: 'DRAFT', label: '등록' },
  { value: 'ACTIVE', label: '판매중' },
  { value: 'SOLD_OUT', label: '품절' },
  { value: 'TEMPORARILY_SOLD_OUT', label: '일시품절' },
  { value: 'SUSPENDED', label: '판매중지' },
] as const

export const skuStatuses = productStatuses.filter((item) => item.value !== 'DRAFT')

export function productStatusLabel(status: string) {
  return productStatuses.find((item) => item.value === status)?.label ?? status
}
