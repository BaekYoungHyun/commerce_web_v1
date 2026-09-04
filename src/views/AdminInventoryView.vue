<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminInventoryStore } from '../stores/adminInventory'
import { formatDateTime } from '../utils/dateTime'
import PageControls from '../components/PageControls.vue'

const route = useRoute()
const router = useRouter()
const store = useAdminInventoryStore()
const { inventory, pagination, loading, error } = storeToRefs(store)
const keyword = ref('')
const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return inventory.value
  return inventory.value.filter((item) =>
    [
      item.seq,
      item.variantSeq,
      item.sku,
      item.productName,
      item.wholesaleStoreName,
      item.variantStatus,
      item.productStatus,
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(query),
    ),
  )
})
const availableTotal = computed(() =>
  filtered.value.reduce((sum, item) => sum + item.availableQuantity, 0),
)
const reservedTotal = computed(() =>
  filtered.value.reduce((sum, item) => sum + item.reservedQuantity, 0),
)
async function load(
  requestedPage: unknown = pagination.value.page,
  requestedSize = pagination.value.size,
) {
  const page = typeof requestedPage === 'number' ? requestedPage : 0
  try {
    await store.fetchInventory({ page, size: requestedSize })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}
onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>WHOLESALE INVENTORY</p>
        <h1>상품 재고 관리</h1>
        <span>SKU별 주문 가능 수량과 출고 전 예약 수량을 관리합니다.</span>
      </div>
      <div class="admin-heading-actions">
        <RouterLink class="admin-secondary-button" to="/admin/supplier/inventory/bulk">
          재고 일괄 관리
        </RouterLink>
        <RouterLink class="admin-primary-button" to="/admin/supplier/inventory/new">
          + 재고 등록
        </RouterLink>
      </div>
    </div>
    <section class="admin-summary">
      <div>
        <span>재고 행</span><strong>{{ filtered.length }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>주문 가능</span><strong>{{ availableTotal }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>예약</span><strong>{{ reservedTotal }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>전체 수량</span><strong>{{ availableTotal + reservedTotal }}</strong
        ><small>개</small>
      </div>
    </section>
    <form class="admin-filter-panel admin-business-filters" @submit.prevent>
      <label class="admin-search-field"
        ><span>재고 검색</span
        ><input v-model="keyword" placeholder="재고 ID, SKU, 상품명, 도매 매장, 상태" /></label
      ><button class="admin-reset-button" type="button" @click="keyword = ''">↻ 초기화</button
      ><button class="admin-search-button" type="button" @click="load">새로고침</button>
    </form>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>SKU 재고 목록</h2>
          <span>총 {{ filtered.length }}개</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table">
          <thead>
            <tr>
              <th>재고 ID</th>
              <th>Variant ID</th>
              <th>SKU</th>
              <th>상품</th>
              <th>옵션</th>
              <th>도매 매장</th>
              <th>주문 가능</th>
              <th>예약</th>
              <th>전체</th>
              <th>수정일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="admin-empty">재고 목록을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="item in filtered" v-else :key="item.seq">
              <td>{{ item.seq }}</td>
              <td>{{ item.variantSeq }}</td>
              <td>
                <strong>{{ item.sku ?? '-' }}</strong>
              </td>
              <td>
                {{ item.productName ?? '-'
                }}<small v-if="item.productStatus">{{ item.productStatus }}</small>
              </td>
              <td>{{ [item.color, item.size].filter(Boolean).join(' / ') || '-' }}</td>
              <td>{{ item.wholesaleStoreName ?? '-' }}</td>
              <td>{{ item.availableQuantity.toLocaleString() }}</td>
              <td>{{ item.reservedQuantity.toLocaleString() }}</td>
              <td>
                <strong>{{ item.totalQuantity.toLocaleString() }}</strong>
              </td>
              <td>{{ formatDateTime(item.updatedAt) }}</td>
              <td>
                <div class="admin-row-actions">
                  <RouterLink :to="`/admin/supplier/inventory/${item.seq}/edit`">수정</RouterLink>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && filtered.length === 0">
              <td colspan="11" class="admin-empty">조회된 재고가 없습니다.</td>
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
