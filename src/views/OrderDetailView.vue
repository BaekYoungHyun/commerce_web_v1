<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useOrdersStore } from '../stores/orders'
import { formatDateTime } from '../utils/dateTime'

const route = useRoute()
const router = useRouter()
const store = useOrdersStore()
const { currentOrder: order, loading, error } = storeToRefs(store)
const isSellerAdmin = computed(() => route.meta.sellerOrders === true)
const ordersPath = computed(() => isSellerAdmin.value ? '/admin/seller/orders' : '/orders')
const money = (value: number) => value.toLocaleString('ko-KR')
const shipmentStatusLabel = (status: string) =>
  status === 'SHIPMENT_PREPARING' ? '출고 준비중' : status === 'SHIPPED' ? '출고 완료' : status
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
  <main :class="isSellerAdmin ? 'admin-content order-detail-page' : 'orders-page order-detail-page'">
    <nav class="admin-breadcrumbs">
      <RouterLink :to="ordersPath">{{ isSellerAdmin ? '주문 관리' : '주문 내역' }}</RouterLink><span>›</span><strong>주문 상세</strong>
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
        <i class="admin-status">{{ order.status }}</i>
      </header>
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
