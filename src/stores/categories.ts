import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { categoryApi } from '../services/categoryApi'
import { ApiError } from '../services/httpClient'
import { useAuthStore } from './auth'
import type { ApiCategory, CategoryOption } from '../types/category'

function flattenCategories(categories: ApiCategory[], parents: string[] = []): CategoryOption[] {
  return categories.flatMap((category) => {
    const path = [...parents, category.name]
    return [
      { seq: category.seq, name: category.name, label: path.join(' > '), depth: category.depth },
      ...flattenCategories(category.children ?? [], path),
    ]
  })
}

export const useCategoriesStore = defineStore('apiCategories', () => {
  const authStore = useAuthStore()
  const categories = ref<ApiCategory[]>([])
  const loading = ref(false)
  const error = ref('')
  const options = computed(() => flattenCategories(categories.value))

  async function fetchCategories() {
    if (categories.value.length) return categories.value
    loading.value = true
    error.value = ''
    try {
      try {
        categories.value = await categoryApi.list(await authStore.getValidAccessToken())
      } catch (cause) {
        if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
        const token = await authStore.refreshAccessToken()
        categories.value = await categoryApi.list(token)
      }
      return categories.value
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '카테고리를 불러오지 못했습니다.'
      throw cause
    } finally {
      loading.value = false
    }
  }

  function nameOf(seq: number) {
    return options.value.find((category) => category.seq === seq)?.label ?? `카테고리 ${seq}`
  }

  return { categories, options, loading, error, fetchCategories, nameOf }
})
