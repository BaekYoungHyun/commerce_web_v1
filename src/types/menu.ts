export type MenuScope = 'WHOLESALE' | 'RETAIL'

export interface MenuItem {
  seq: number
  code: string
  name: string
  depth: 1 | 2
  routePath: string | null
  icon: string | null
  sortOrder: number
  children: MenuItem[]
}
