<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  size: number
  totalPages: number
  totalElements: number
}>()
const emit = defineEmits<{ change: [page: number, size?: number] }>()

const PAGE_GROUP_SIZE = 10
const visiblePages = computed(() => {
  const groupStart = Math.floor(props.page / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE
  const groupEnd = Math.min(groupStart + PAGE_GROUP_SIZE, props.totalPages)

  return Array.from(
    { length: Math.max(groupEnd - groupStart, 0) },
    (_, index) => groupStart + index,
  )
})

function changeSize(event: Event) {
  const size = Number((event.target as HTMLSelectElement).value)
  emit('change', 0, size)
}
</script>

<template>
  <nav v-if="totalPages > 0" class="admin-pagination" aria-label="목록 페이지">
    <div class="admin-pagination-controls">
      <button
        type="button"
        class="admin-pagination-direction"
        :disabled="page <= 0"
        aria-label="이전 페이지"
        @click="$emit('change', page - 1)"
      >
        <span aria-hidden="true">‹</span> 이전
      </button>
      <div class="admin-pagination-pages">
        <button
          v-for="pageIndex in visiblePages"
          :key="pageIndex"
          type="button"
          :class="{ active: pageIndex === page }"
          :aria-current="pageIndex === page ? 'page' : undefined"
          :aria-label="`${pageIndex + 1}페이지`"
          @click="$emit('change', pageIndex)"
        >
          {{ pageIndex + 1 }}
        </button>
      </div>
      <button
        type="button"
        class="admin-pagination-direction"
        :disabled="page + 1 >= totalPages"
        aria-label="다음 페이지"
        @click="$emit('change', page + 1)"
      >
        다음 <span aria-hidden="true">›</span>
      </button>
    </div>
    <label class="admin-pagination-size">
      <span class="sr-only">페이지당 목록 수</span>
      <select :value="size" @change="changeSize">
        <option :value="10">10개씩 보기</option>
        <option :value="20">20개씩 보기</option>
        <option :value="30">30개씩 보기</option>
        <option :value="50">50개씩 보기</option>
        <option :value="100">100개씩 보기</option>
      </select>
    </label>
    <span class="admin-pagination-total">총 {{ totalElements.toLocaleString() }}건</span>
  </nav>
</template>
