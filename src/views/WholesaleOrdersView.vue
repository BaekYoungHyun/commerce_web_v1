<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useWholesaleFulfillmentStore } from '../stores/wholesaleFulfillment'
import type { OrderItemFulfillmentStatus, WholesaleOrderItem } from '../types/wholesaleFulfillment'
import { formatDateTime } from '../utils/dateTime'
import PageControls from '../components/PageControls.vue'

const store = useWholesaleFulfillmentStore()
const { stores, orders, ordersPagination, loading, pendingKey, error } = storeToRefs(store)
const wholesaleStoreSeq = ref<number | null>(null)
const status = ref('')
const selectedStatuses = reactive<Record<number, OrderItemFulfillmentStatus>>({})
const statuses: Array<{ value: OrderItemFulfillmentStatus; label: string }> = [
  { value: 'PRODUCT_ORDERED', label: '주문상품' },
  { value: 'PRODUCT_PREPARING', label: '상품 준비중' },
  { value: 'PRODUCT_READY', label: '상품 준비 완료' },
]
const labels: Record<string, string> = Object.fromEntries(
  statuses.map((item) => [item.value, item.label]),
)
const money = (value: number) => value.toLocaleString('ko-KR')
const options = (item: WholesaleOrderItem) =>
  [item.sku, item.color, item.size].filter((value) => value != null && value !== '').join(' / ') ||
  `Variant #${item.variantSeq}`
const allReady = (items: WholesaleOrderItem[]) =>
  items.length > 0 && items.every((item) => item.status === 'PRODUCT_READY')
const shipmentStores = (items: WholesaleOrderItem[]) => [
  ...new Set(items.map((item) => item.wholesaleStoreSeq)),
]
const total = (items: WholesaleOrderItem[]) => items.reduce((sum, item) => sum + item.lineAmount, 0)
const canSelectStatus = (
  current: WholesaleOrderItem['status'],
  candidate: OrderItemFulfillmentStatus,
) => {
  const currentIndex = statuses.findIndex((item) => item.value === current)
  const candidateIndex = statuses.findIndex((item) => item.value === candidate)
  return candidateIndex === currentIndex || candidateIndex === currentIndex + 1
}
const count = computed(() => orders.value.reduce((sum, order) => sum + order.items.length, 0))

async function load(
  requestedPage: unknown = ordersPagination.value.page,
  requestedSize = ordersPagination.value.size,
) {
  const page = typeof requestedPage === 'number' ? requestedPage : 0
  await store
    .fetchOrders({
      page,
      size: requestedSize,
      wholesaleStoreSeq: wholesaleStoreSeq.value || undefined,
      status: status.value || undefined,
    })
    .catch(() => undefined)
  for (const order of orders.value)
    for (const item of order.items) selectedStatuses[item.orderItemSeq] = item.status
}
const reset = () => {
  wholesaleStoreSeq.value = null
  status.value = ''
  load(0)
}
const saveStatus = async (orderSeq: number, item: WholesaleOrderItem) => {
  await store
    .updateOrderItemStatus(
      orderSeq,
      item.orderItemSeq,
      selectedStatuses[item.orderItemSeq] ?? item.status,
    )
    .catch(() => undefined)
}
const createShipment = async (orderSeq: number, storeSeq: number) => {
  await store
    .createShipment(orderSeq, storeSeq)
    .then(() => load())
    .catch(() => undefined)
}
onMounted(async () => {
  await store
    .fetchStores()
    .then(load)
    .catch(() => undefined)
})
</script>

<template>
  <main class="admin-content admin-list-content fulfillment-page">
    <header class="admin-page-heading">
      <div>
        <p>WHOLESALE ORDERS</p>
        <h1>도매 주문 관리</h1>
        <span>내 도매 매장의 주문 상품을 준비 완료까지 처리합니다.</span>
      </div>
      <div class="fulfillment-summary">
        <strong>{{ orders.length }}</strong
        ><span>주문</span><strong>{{ count }}</strong
        ><span>품목</span>
      </div>
    </header>
    <form class="admin-filter-panel fulfillment-filters" @submit.prevent="load(0)">
      <label
        ><span>내 도매 매장</span
        ><select v-model="wholesaleStoreSeq">
          <option :value="null">내 전체 매장</option>
          <option v-for="ownedStore in stores" :key="ownedStore.seq" :value="ownedStore.seq">
            {{ ownedStore.storeName }} (#{{ ownedStore.seq }})
          </option>
        </select></label
      ><label
        ><span>상품 상태</span
        ><select v-model="status">
          <option value="">전체 상태</option>
          <option v-for="item in statuses" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select></label
      ><button class="admin-reset-button" type="button" @click="reset">↻ 초기화</button
      ><button class="admin-search-button" type="submit">검색</button>
    </form>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <div v-if="loading" class="admin-empty fulfillment-loading">주문을 불러오는 중입니다.</div>
    <section v-else class="fulfillment-order-list">
      <article v-for="order in orders" :key="order.orderSeq" class="fulfillment-order-card">
        <header>
          <div>
            <span>{{ order.orderNo }}</span
            ><strong>{{ formatDateTime(order.createdAt) }}</strong>
          </div>
          <dl>
            <div>
              <dt>수령인</dt>
              <dd>{{ order.recipientName }} · {{ order.recipientPhone }}</dd>
            </div>
            <div>
              <dt>소매 매장</dt>
              <dd>{{ order.retailStoreName ?? `#${order.retailStoreSeq}` }}</dd>
            </div>
            <div>
              <dt>구매처</dt>
              <dd>{{ order.buyerCompanyName ?? '사업자 정보 없음' }}</dd>
            </div>
            <div>
              <dt>합계</dt>
              <dd>{{ money(total(order.items)) }}원</dd>
            </div>
          </dl>
        </header>
        <div class="admin-table-scroll">
          <table class="fulfillment-items-table">
            <thead>
              <tr>
                <th>도매 매장</th>
                <th>상품</th>
                <th>옵션</th>
                <th>수량</th>
                <th>금액</th>
                <th>현재 상태</th>
                <th>상태 변경</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.orderItemSeq">
                <td>{{ item.wholesaleStoreName ?? `#${item.wholesaleStoreSeq}` }}</td>
                <td>
                  <strong>{{ item.productName }}</strong
                  ><small>Product #{{ item.productSeq }}</small>
                </td>
                <td>{{ options(item) }}</td>
                <td>{{ item.quantity }}개</td>
                <td>{{ money(item.lineAmount) }}원</td>
                <td>
                  <i class="admin-status">{{ labels[item.status] }}</i>
                </td>
                <td>
                  <div class="fulfillment-status-action">
                    <select
                      v-model="selectedStatuses[item.orderItemSeq]"
                      :disabled="item.status === 'PRODUCT_READY'"
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
                      :disabled="
                        pendingKey === `order-item-${item.orderItemSeq}` ||
                        selectedStatuses[item.orderItemSeq] === item.status
                      "
                      @click="saveStatus(order.orderSeq, item)"
                    >
                      저장
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer v-if="allReady(order.items)">
          <span>모든 상품이 준비 완료되어 출고 정보가 자동 생성됩니다.</span
          ><button
            v-for="storeSeq in shipmentStores(order.items)"
            :key="storeSeq"
            type="button"
            :disabled="pendingKey === `shipment-${order.orderSeq}-${storeSeq}`"
            @click="createShipment(order.orderSeq, storeSeq)"
          >
            출고 정보 확인·생성 #{{ storeSeq }}
          </button>
        </footer>
      </article>
      <div v-if="!orders.length" class="admin-empty fulfillment-loading">
        조건에 해당하는 도매 주문이 없습니다.
      </div>
      <PageControls
        :page="ordersPagination.page"
        :size="ordersPagination.size"
        :total-pages="ordersPagination.totalPages"
        :total-elements="ordersPagination.totalElements"
        @change="load"
      />
    </section>
  </main>
</template>
