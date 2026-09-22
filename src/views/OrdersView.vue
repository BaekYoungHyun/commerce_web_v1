<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useOrdersStore } from '../stores/orders'
import { formatDateTime } from '../utils/dateTime'
import PageControls from '../components/PageControls.vue'

const route = useRoute()
const router = useRouter()
const store = useOrdersStore()
const { orders, pagination, loading, error } = storeToRefs(store)
const keyword = ref('')
const isAdmin = computed(() => route.meta.adminOrders === true)
const isSupplierAdmin = computed(() => route.meta.supplierOrders === true)
const isSellerAdmin = computed(() => route.meta.sellerOrders === true)
const isSellerOrders = computed(() => !isAdmin.value && !isSupplierAdmin.value)
const usesAdminLayout = computed(
  () => isAdmin.value || isSupplierAdmin.value || isSellerAdmin.value,
)
const headingEyebrow = computed(() =>
  isSupplierAdmin.value
    ? 'WHOLESALE ORDERS'
    : isAdmin.value
      ? 'ADMIN ORDERS'
      : isSellerAdmin.value
        ? 'SELLER ORDERS'
        : 'MY ORDERS',
)
const headingTitle = computed(() =>
  isSupplierAdmin.value || isSellerAdmin.value
    ? '주문 관리'
    : isAdmin.value
      ? '전체 주문 관리'
      : '주문 내역',
)
const headingDescription = computed(() =>
  isSupplierAdmin.value
    ? '도매 매장으로 접수된 주문과 상품별 처리 상태를 확인합니다.'
    : isAdmin.value
      ? '서비스의 전체 주문과 주문자·매장 정보를 확인합니다.'
      : isSellerAdmin.value
        ? '구매 주문과 도매업체별 출고·배송 진행 상태를 확인합니다.'
        : '최근 주문과 상품별 처리 상태를 확인합니다.',
)
const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return orders.value
  return orders.value.filter((order) =>
    [
      order.orderNo,
      order.retailStoreName,
      order.buyerName,
      order.status,
      order.recipientName,
      ...order.items.flatMap((item) => [
        item.productName,
        item.option?.sku,
        item.option?.color,
        item.option?.size,
      ]),
      ...(order.shipments ?? []).flatMap((shipment) => [
        shipment.wholesaleStoreName,
        shipment.deliveryCompanyName,
        shipment.deliveryCompanyCode,
        shipment.trackingNumber,
        shipment.status,
      ]),
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(query),
    ),
  )
})
const money = (value: number) => value.toLocaleString('ko-KR')
const wholesaleNames = (order: (typeof orders.value)[number]) => {
  const names = [
    ...new Set(order.items.map((item) => item.wholesaleStoreName ?? `#${item.wholesaleStoreSeq}`)),
  ]
  return names.join(', ') || '-'
}
const optionLabel = (item: (typeof orders.value)[number]['items'][number]) =>
  [item.option?.sku, item.option?.color, item.option?.size].filter(Boolean).join(' / ') ||
  `Variant #${item.variantSeq}`
const shipmentStatusLabel = (status: string) =>
  status === 'SHIPMENT_PREPARING' ? '출고 준비중' : status === 'SHIPPED' ? '출고 완료' : status
const itemStatusLabel = (status: string) =>
  ({
    PRODUCT_ORDERED: '상품주문',
    PRODUCT_PREPARING: '상품 준비중',
    PRODUCT_READY: '상품 준비 완료',
  })[status] ?? status
async function load(
  requestedPage: unknown = pagination.value.page,
  requestedSize = pagination.value.size,
) {
  const page = typeof requestedPage === 'number' ? requestedPage : 0
  try {
    await store.fetchOrders(isAdmin.value, { page, size: requestedSize })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}
onMounted(load)
</script>

<template>
  <main :class="usesAdminLayout ? 'admin-content admin-list-content' : 'orders-page'">
    <div :class="usesAdminLayout ? 'admin-page-heading' : 'orders-heading'">
      <div>
        <p>{{ headingEyebrow }}</p>
        <h1>{{ headingTitle }}</h1>
        <span>{{ headingDescription }}</span>
      </div>
    </div>
    <form
      :class="usesAdminLayout ? 'admin-filter-panel admin-business-filters' : 'orders-search'"
      @submit.prevent
    >
      <label class="admin-search-field"
        ><span>주문 검색</span
        ><input v-model="keyword" placeholder="주문번호, 매장, 주문자, 상품명, SKU, 상태" /></label
      ><button class="admin-reset-button" type="button" @click="keyword = ''">↻ 초기화</button
      ><button class="admin-search-button" type="button" @click="load">새로고침</button>
    </form>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <section v-if="isSellerAdmin" class="seller-order-list">
      <div class="seller-order-list-toolbar">
        <div>
          <h2>주문 목록</h2>
          <span>현재 페이지 {{ filtered.length }}건 · 전체 {{ pagination.totalElements }}건</span>
        </div>
      </div>
      <div v-if="loading" class="seller-order-list-state">주문을 불러오는 중입니다.</div>
      <div v-else-if="filtered.length" class="admin-table-scroll">
        <table class="admin-product-table admin-business-table seller-order-table">
          <thead>
            <tr>
              <th>주문번호</th>
              <th>주문 매장</th>
              <th>주문 상품</th>
              <th>도매처</th>
              <th>수량</th>
              <th>주문 금액</th>
              <th>주문 상태</th>
              <th>배송 현황</th>
              <th>주문일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filtered" :key="order.seq">
              <td>
                <strong>{{ order.orderNo }}</strong
                ><small>수령인 {{ order.recipientName }}</small>
              </td>
              <td>
                <strong>{{ order.retailStoreName ?? `#${order.retailStoreSeq}` }}</strong
                ><small>{{ order.buyerName ?? order.buyerUserId ?? '-' }}</small>
              </td>
              <td>
                <div class="seller-order-inline-products">
                  <div v-for="item in order.items" :key="item.seq">
                    <strong>{{ item.productName }}</strong
                    ><small>{{ optionLabel(item) }} · {{ money(item.unitPrice) }}원</small
                    ><i class="admin-status">{{ itemStatusLabel(item.status) }}</i>
                  </div>
                </div>
              </td>
              <td>{{ wholesaleNames(order) }}</td>
              <td>{{ order.items.reduce((sum, item) => sum + item.quantity, 0) }}개</td>
              <td>
                <strong>{{ money(order.totalAmount) }}원</strong>
              </td>
              <td>
                <i class="admin-status">{{ order.status }}</i>
              </td>
              <td>
                <div v-if="order.shipments?.length" class="seller-order-inline-shipments">
                  <span v-for="shipment in order.shipments" :key="shipment.shipmentSeq"
                    >{{ shipment.wholesaleStoreName ?? '도매 매장' }} ·
                    {{ shipmentStatusLabel(shipment.status)
                    }}<small v-if="shipment.deliveryCompanyName || shipment.trackingNumber"
                      >{{ shipment.deliveryCompanyName ?? shipment.deliveryCompanyCode
                      }}<template v-if="shipment.trackingNumber">
                        · {{ shipment.trackingNumber }}</template
                      ></small
                    ></span
                  >
                </div>
                <span v-else class="seller-order-shipment-empty">출고 준비 전</span>
              </td>
              <td>{{ formatDateTime(order.createdAt) }}</td>
              <td>
                <RouterLink class="admin-table-action" :to="`/admin/seller/orders/${order.seq}`"
                  >상세</RouterLink
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="seller-order-list-state">주문 내역이 없습니다.</div>
      <PageControls
        :page="pagination.page"
        :size="pagination.size"
        :total-pages="pagination.totalPages"
        :total-elements="pagination.totalElements"
        @change="load"
      />
    </section>
    <section v-else class="admin-table-panel order-list-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>주문 목록</h2>
          <span>총 {{ filtered.length }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table order-table">
          <colgroup>
            <col class="order-number-column" />
            <col v-if="isSupplierAdmin" class="order-store-column" />
            <col class="order-store-column" />
            <col class="order-person-column" />
            <col class="order-person-column" />
            <col class="order-products-column" />
            <col v-if="isSellerOrders" class="order-shipment-column" />
            <col class="order-status-column" />
            <col class="order-amount-column" />
            <col class="order-date-column" />
            <col class="order-action-column" />
          </colgroup>
          <thead>
            <tr>
              <th class="order-number-cell">주문번호</th>
              <th v-if="isSupplierAdmin" class="order-store-cell">도매 매장</th>
              <th class="order-store-cell">소매 매장</th>
              <th class="order-person-cell">주문자</th>
              <th class="order-person-cell">수령인</th>
              <th class="order-products-cell">주문 상품</th>
              <th v-if="isSellerOrders">배송</th>
              <th class="order-status-cell">상태</th>
              <th class="order-amount-cell">주문 금액</th>
              <th class="order-date-cell">주문일</th>
              <th class="order-action-cell">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="isSupplierAdmin ? 10 : isSellerOrders ? 10 : 9" class="admin-empty">
                주문을 불러오는 중입니다.
              </td>
            </tr>
            <tr v-for="order in filtered" v-else :key="order.seq">
              <td class="order-number-cell">
                <strong>{{ order.orderNo }}</strong>
              </td>
              <td v-if="isSupplierAdmin" class="order-store-cell">{{ wholesaleNames(order) }}</td>
              <td class="order-store-cell">
                {{ order.retailStoreName ?? `#${order.retailStoreSeq}` }}
              </td>
              <td class="order-person-cell">{{ order.buyerName ?? order.buyerUserId ?? '-' }}</td>
              <td class="order-person-cell">{{ order.recipientName }}</td>
              <td class="order-products-cell">
                <ul class="order-product-list">
                  <li v-for="item in order.items" :key="item.seq">
                    <strong>{{ item.productName }}</strong
                    ><span>{{ optionLabel(item) }} · {{ item.quantity }}개</span
                    ><small v-if="isSupplierAdmin"
                      >{{ item.wholesaleStoreName ?? `도매 매장 #${item.wholesaleStoreSeq}` }} ·
                      {{ money(item.lineAmount) }}원</small
                    >
                  </li>
                </ul>
              </td>
              <td v-if="isSellerOrders">
                <ul v-if="order.shipments?.length" class="seller-shipment-summary">
                  <li v-for="shipment in order.shipments" :key="shipment.shipmentSeq">
                    <i class="admin-status">{{ shipmentStatusLabel(shipment.status) }}</i
                    ><strong>{{ shipment.wholesaleStoreName ?? '도매 매장' }}</strong
                    ><span v-if="shipment.deliveryCompanyName || shipment.trackingNumber"
                      >{{ shipment.deliveryCompanyName ?? shipment.deliveryCompanyCode
                      }}<template v-if="shipment.trackingNumber">
                        · {{ shipment.trackingNumber }}</template
                      ></span
                    >
                  </li>
                </ul>
                <span v-else class="seller-shipment-empty">출고 준비 전</span>
              </td>
              <td class="order-status-cell">
                <i class="admin-status">{{ order.status }}</i>
              </td>
              <td class="order-amount-cell">
                <strong>{{ money(order.totalAmount) }}원</strong>
              </td>
              <td class="order-date-cell">{{ formatDateTime(order.createdAt) }}</td>
              <td class="order-action-cell">
                <div class="admin-row-actions">
                  <RouterLink
                    v-if="!isAdmin"
                    :to="
                      isSellerAdmin ? `/admin/seller/orders/${order.seq}` : `/orders/${order.seq}`
                    "
                    >상세</RouterLink
                  ><span v-else>조회</span>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && filtered.length === 0">
              <td :colspan="isSupplierAdmin ? 10 : isSellerOrders ? 10 : 9" class="admin-empty">
                주문 내역이 없습니다.
              </td>
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
