<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useOrdersStore } from '../stores/orders'
import { useSellerAdminStore } from '../stores/sellerAdmin'
import type { ClaimType, OrderItem } from '../types/order'
import { formatDateTime } from '../utils/dateTime'

const route = useRoute()
const router = useRouter()
const store = useOrdersStore()
const sellerStore = useSellerAdminStore()
const { currentOrder: order, loading, error, mutating } = storeToRefs(store)
const isSellerAdmin = computed(() => route.meta.sellerOrders === true)
const isSellerOrder = computed(() => !route.meta.adminOrders)
const canCancel = computed(() =>
  Boolean(order.value && ['PRODUCT_ORDERED', 'PRODUCT_PREPARING'].includes(order.value.status)),
)
const claimOpen = ref(false)
const actionMessage = ref('')
const claimForm = reactive({
  orderItemSeq: 0,
  claimType: 'CANCEL' as ClaimType,
  quantity: 1,
  reason: '',
})
const ordersPath = computed(() => (isSellerAdmin.value ? '/admin/seller/orders' : '/orders'))
const money = (value: number) => value.toLocaleString('ko-KR')
const shipmentStatusLabel = (status: string) =>
  status === 'SHIPMENT_PREPARING' ? '출고 준비중' : status === 'SHIPPED' ? '출고 완료' : status
async function cancelOrder() {
  if (!order.value || !canCancel.value || !window.confirm('이 주문을 취소하시겠습니까?')) return
  actionMessage.value = ''
  await store
    .cancelOrder(order.value.seq)
    .then((result) => {
      actionMessage.value = `주문이 취소되었습니다. 재고 ${result.restoredQuantity}개가 복구되었습니다.`
    })
    .catch(() => undefined)
}
function openClaim(item: OrderItem) {
  Object.assign(claimForm, {
    orderItemSeq: item.seq,
    claimType: item.status === 'SHIPPED' ? 'RETURN' : 'CANCEL',
    quantity: 1,
    reason: '',
  })
  claimOpen.value = true
  actionMessage.value = ''
}
async function submitClaim() {
  if (claimForm.orderItemSeq < 1 || claimForm.quantity < 1) return
  await sellerStore
    .createClaim({ ...claimForm, reason: claimForm.reason.trim() || null })
    .then(() => {
      claimOpen.value = false
      actionMessage.value = '클레임이 접수되었습니다.'
    })
    .catch(() => undefined)
}
onMounted(async () => {
  try {
    await store.fetchOrder(Number(route.params.id))
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
})
</script>

<template>
  <main
    :class="isSellerAdmin ? 'admin-content order-detail-page' : 'orders-page order-detail-page'"
  >
    <nav class="admin-breadcrumbs">
      <RouterLink :to="ordersPath">{{ isSellerAdmin ? '주문 관리' : '주문 내역' }}</RouterLink
      ><span>›</span><strong>주문 상세</strong>
    </nav>
    <div v-if="loading" class="cart-loading">주문을 불러오는 중입니다.</div>
    <div v-else-if="error || !order" class="cart-error">
      <strong>주문을 확인하지 못했습니다.</strong>
      <p>{{ error }}</p>
    </div>
    <template v-else
      ><header class="orders-heading">
        <div>
          <p>ORDER DETAIL</p>
          <h1>{{ order.orderNo }}</h1>
          <span>{{ formatDateTime(order.createdAt) }}</span>
        </div>
        <div class="order-detail-actions">
          <i class="admin-status">{{ order.status }}</i>
          <button
            v-if="isSellerOrder && canCancel"
            class="admin-primary-button"
            type="button"
            :disabled="mutating"
            @click="cancelOrder"
          >
            {{ mutating ? '취소 처리 중' : '주문 취소' }}
          </button>
        </div>
      </header>
      <p v-if="actionMessage" class="order-action-message">{{ actionMessage }}</p>
      <p v-if="sellerStore.error" class="admin-list-error">{{ sellerStore.error }}</p>
      <form v-if="claimOpen" class="admin-common-form" @submit.prevent="submitClaim">
        <div class="admin-common-form-grid">
          <label
            ><span>클레임 유형</span
            ><select v-model="claimForm.claimType">
              <option value="CANCEL">취소</option>
              <option value="RETURN">반품</option>
            </select></label
          >
          <label
            ><span>수량</span
            ><input v-model.number="claimForm.quantity" type="number" min="1" required
          /></label>
        </div>
        <label><span>사유</span><textarea v-model="claimForm.reason" rows="3" /></label>
        <div class="admin-common-form-actions">
          <button type="button" @click="claimOpen = false">닫기</button
          ><button class="admin-primary-button" :disabled="sellerStore.saving">접수</button>
        </div>
      </form>
      <section class="order-info-grid">
        <div>
          <span>주문 매장</span
          ><strong>{{ order.retailStoreName ?? `#${order.retailStoreSeq}` }}</strong>
        </div>
        <div>
          <span>수령인</span><strong>{{ order.recipientName }}</strong
          ><small>{{ order.recipientPhone }}</small>
        </div>
        <div>
          <span>주문자</span><strong>{{ order.buyerName ?? order.buyerUserId ?? '-' }}</strong>
        </div>
      </section>
      <section class="admin-table-panel">
        <div class="admin-table-toolbar">
          <div>
            <h2>주문 상품</h2>
            <span>{{ order.items.length }}종</span>
          </div>
        </div>
        <div class="admin-table-scroll">
          <table class="admin-product-table admin-business-table">
            <thead>
              <tr>
                <th>도매 매장</th>
                <th>상품</th>
                <th>옵션</th>
                <th>단가</th>
                <th>수량</th>
                <th>금액</th>
                <th>상태</th>
                <th v-if="isSellerOrder">클레임</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.seq">
                <td>{{ item.wholesaleStoreName ?? `#${item.wholesaleStoreSeq}` }}</td>
                <td>{{ item.productName }}</td>
                <td>
                  {{
                    item.option
                      ? [item.option.sku, item.option.color, item.option.size]
                          .filter(Boolean)
                          .join(' / ')
                      : '-'
                  }}
                </td>
                <td>{{ money(item.unitPrice) }}원</td>
                <td>{{ item.quantity }}개</td>
                <td>{{ money(item.lineAmount) }}원</td>
                <td>
                  <i class="admin-status">{{ item.status }}</i>
                </td>
                <td v-if="isSellerOrder">
                  <button
                    v-if="!['CANCELED', 'SHIPPED'].includes(item.status)"
                    type="button"
                    @click="openClaim(item)"
                  >
                    접수</button
                  ><button
                    v-else-if="item.status === 'SHIPPED'"
                    type="button"
                    @click="openClaim(item)"
                  >
                    반품 접수</button
                  ><span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="seller-shipment-section">
        <header>
          <div>
            <p>DELIVERY STATUS</p>
            <h2>배송 진행 정보</h2>
          </div>
          <span>{{ order.shipments?.length ?? 0 }}건</span>
        </header>
        <div v-if="order.shipments?.length" class="seller-shipment-grid">
          <article
            v-for="shipment in order.shipments"
            :key="shipment.shipmentSeq"
            class="seller-shipment-card"
          >
            <div>
              <strong>{{ shipment.wholesaleStoreName ?? '도매 매장 정보 없음' }}</strong
              ><i class="admin-status">{{ shipmentStatusLabel(shipment.status) }}</i>
            </div>
            <dl>
              <div>
                <dt>택배사</dt>
                <dd>
                  {{ shipment.deliveryCompanyName ?? shipment.deliveryCompanyCode ?? '미정' }}
                </dd>
              </div>
              <div>
                <dt>송장번호</dt>
                <dd>{{ shipment.trackingNumber ?? '미발급' }}</dd>
              </div>
              <div>
                <dt>출고일</dt>
                <dd>{{ formatDateTime(shipment.shippedAt) }}</dd>
              </div>
              <div>
                <dt>출고 수량</dt>
                <dd>{{ shipment.items.reduce((sum, item) => sum + item.quantity, 0) }}개</dd>
              </div>
            </dl>
          </article>
        </div>
        <p v-else class="seller-shipment-empty-card">
          도매업체에서 아직 출고 정보를 생성하지 않았습니다.
        </p>
      </section>
      <section class="order-total-card">
        <dl>
          <div>
            <dt>상품 금액</dt>
            <dd>{{ money(order.subtotalAmount) }}원</dd>
          </div>
          <div>
            <dt>배송비</dt>
            <dd>{{ money(order.shippingFee) }}원</dd>
          </div>
          <div>
            <dt>할인</dt>
            <dd>-{{ money(order.discountAmount) }}원</dd>
          </div>
        </dl>
        <div>
          <span>총 주문 금액</span><strong>{{ money(order.totalAmount) }}원</strong>
        </div>
      </section></template
    >
  </main>
</template>
