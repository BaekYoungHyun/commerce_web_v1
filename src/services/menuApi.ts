import { apiRequest } from './httpClient'
import type { MenuItem, MenuScope } from '../types/menu'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })

export const menuApi = {
  navigation(token: string, scope?: MenuScope) {
    const query = scope ? `?scope=${scope}` : ''
    return apiRequest<MenuItem[]>(`/menus/navigation${query}`, { headers: headers(token) })
  },
}
