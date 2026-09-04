export interface ApiCategory {
  seq: number
  parentSeq: number | null
  depth: number
  code: string
  name: string
  sortOrder: number
  isActive: boolean
  children: ApiCategory[]
}

export interface CategoryOption {
  seq: number
  name: string
  label: string
  depth: number
}
