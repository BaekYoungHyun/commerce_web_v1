<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminStockReceiptsStore } from '../stores/adminStockReceipts'
import type { StockReceiptStatus } from '../types/adminStockReceipt'
import { formatDateTime } from '../utils/dateTime'
import PageControls from '../components/PageControls.vue'

const route = useRoute()
const router = useRouter()
const store = useAdminStockReceiptsStore()
const { receipts, pagination, loading, error } = storeToRefs(store)
const keyword = ref('')
const status = ref('')
const pendingSeq = ref<number | null>(null)
const selectedStatuses = reactive<Record<number, StockReceiptStatus>>({})
const statuses: Array<{ value: StockReceiptStatus; label: string }> = [
  { value: 'REGISTERED', label: '등록' },
  { value: 'EXPECTED', label: '입고예정' },
  { value: 'COMPLETED', label: '입고완료' },
]
const labels: Record<StockReceiptStatus, string> = {
  REGISTERED: '등록',
  EXPECTED: '입고예정',
  COMPLETED: '입고완료',
}
const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return receipts.value.filter(
    (item) =>
      (!status.value || item.status === status.value) &&
      (!query ||
        [
          item.seq,
          item.variantSeq,
          item.sku,
          item.productName,
          item.wholesaleStoreName,
          item.memo,
        ].some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(query),
        )),
  )
})
async function load(
  requestedPage: unknown = pagination.value.page,
  requestedSize = pagination.value.size,
) {
  const page = typeof requestedPage === 'number' ? requestedPage : 0
  try {
    await store.fetchReceipts({ page, size: requestedSize, status: status.value || undefined })
    for (const item of receipts.value) selectedStatuses[item.seq] = item.status
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}
function resetFilters() {
  keyword.value = ''
  status.value = ''
  load(0)
}
function canSelectStatus(current: StockReceiptStatus, candidate: StockReceiptStatus) {
  const currentIndex = statuses.findIndex((item) => item.value === current)
  const candidateIndex = statuses.findIndex((item) => item.value === candidate)
  return candidateIndex === currentIndex || candidateIndex === currentIndex + 1
}
async function saveStatus(item: (typeof receipts.value)[number]) {
  const nextStatus = selectedStatuses[item.seq] ?? item.status
  if (nextStatus === item.status || pendingSeq.value !== null) return
  if (
    nextStatus === 'COMPLETED' &&
    !window.confirm(
      '입고완료 처리 시 주문 가능 재고에 즉시 반영되며 되돌릴 수 없습니다. 계속할까요?',
    )
  ) {
    selectedStatuses[item.seq] = item.status
    return
  }
  pendingSeq.value = item.seq
  try {
    const saved = await store.saveReceipt(
      { variantSeq: item.variantSeq, quantity: item.quantity, memo: item.memo, status: nextStatus },
      item.seq,
    )
    selectedStatuses[item.seq] = saved.status
  } catch (cause) {
    selectedStatuses[item.seq] = item.status
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  } finally {
    pendingSeq.value = null
  }
}
onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>WHOLESALE STOCK RECEIPTS</p>
        <h1>도매상품 입고 관리</h1>
        <span>SKU 입고를 등록·검수하고 완료 시 주문 가능 재고에 반영합니다.</span>
      </div>
      <RouterLink class="admin-primary-button" to="/admin/supplier/stock-receipts/new"
        >+ 입고 등록</RouterLink
      >
    </div>
    <section class="admin-summary">
      <div>
        <span>전체 입고</span><strong>{{ receipts.length }}</strong
        ><small>건</small>
      </div>
      <div>
        <span>등록</span
        ><strong>{{ receipts.filter((item) => item.status === 'REGISTERED').length }}</strong
        ><small>건</small>
      </div>
      <div>
        <span>입고예정</span
        ><strong>{{ receipts.filter((item) => item.status === 'EXPECTED').length }}</strong
        ><small>건</small>
      </div>
      <div>
        <span>입고완료</span
        ><strong>{{ receipts.filter((item) => item.status === 'COMPLETED').length }}</strong
        ><small>건</small>
      </div>
    </section>
    <form class="admin-filter-panel admin-business-filters" @submit.prevent>
      <label
        ><span>입고 상태</span
        ><select v-model="status">
          <option value="">전체</option>
          <option v-for="(label, value) in labels" :key="value" :value="value">{{ label }}</option>
        </select></label
      ><label class="admin-search-field"
        ><span>입고 검색</span
        ><input v-model="keyword" placeholder="입고 ID, SKU, 상품명, 도매 매장, 메모" /></label
      ><button class="admin-reset-button" type="button" @click="resetFilters">↻ 초기화</button
      ><button class="admin-search-button" type="button" @click="load">새로고침</button>
    </form>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>입고 목록</h2>
          <span>총 {{ filtered.length }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>상품</th>
              <th>옵션</th>
              <th>도매 매장</th>
              <th>입고 수량</th>
              <th>현재 상태</th>
              <th>상태 변경</th>
              <th>완료일</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="admin-empty">입고 목록을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="item in filtered" v-else :key="item.seq">
              <td>{{ item.seq }}</td>
              <td>
                <strong>{{ item.sku ?? `Variant #${item.variantSeq}` }}</strong>
              </td>
              <td>{{ item.productName ?? '-' }}</td>
              <td>{{ [item.color, item.size].filter(Boolean).join(' / ') || '-' }}</td>
              <td>{{ item.wholesaleStoreName ?? '-' }}</td>
              <td>{{ item.quantity.toLocaleString() }}개</td>
              <td>
                <i class="admin-status">{{ labels[item.status] }}</i>
              </td>
              <td>
                <div class="fulfillment-status-action">
                  <select
                    v-model="selectedStatuses[item.seq]"
                    :disabled="item.status === 'COMPLETED' || pendingSeq === item.seq"
                  >
                    <option
                      v-for="state in statuses"
                      :key="state.value"
                      :value="state.value"
                      :disabled="!canSelectStatus(item.status, state.value)"
                    >
                      {{ state.label }}
                    </option></select
                  ><button
                    type="button"
                    :disabled="pendingSeq !== null || selectedStatuses[item.seq] === item.status"
                    @click="saveStatus(item)"
                  >
                    {{ pendingSeq === item.seq ? '저장 중...' : '저장' }}
                  </button>
                </div>
              </td>
              <td>{{ formatDateTime(item.completedAt) }}</td>
              <td>{{ formatDateTime(item.createdAt) }}</td>
              <td>
                <div class="admin-row-actions">
                  <RouterLink :to="`/admin/supplier/stock-receipts/${item.seq}/edit`">{{
                    item.status === 'COMPLETED' ? '보기' : '수정'
                  }}</RouterLink>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !filtered.length">
              <td colspan="11" class="admin-empty">조회된 입고가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <PageControls
        :page="pagination.page"
        :size="pagination.size"
        :total-pages="pagination.totalPages"
        :total-elements="pagination.totalElements"
        @change="load"
      />
    </section>
  </main>
</template>
