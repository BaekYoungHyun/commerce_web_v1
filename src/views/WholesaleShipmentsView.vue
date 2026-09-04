<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useWholesaleFulfillmentStore } from '../stores/wholesaleFulfillment'
import type { ShipmentStatus } from '../types/wholesaleFulfillment'
import { formatDateTime } from '../utils/dateTime'
import PageControls from '../components/PageControls.vue'

const store = useWholesaleFulfillmentStore()
const { stores, shipments, shipmentsPagination, deliveryCompanies, loading, pendingKey, error } =
  storeToRefs(store)
const wholesaleStoreSeq = ref<number | null>(null)
const status = ref('')
const drafts = reactive<
  Record<number, { status: ShipmentStatus; deliveryCompanyCode: string; trackingNumber: string }>
>({})
const quantities = reactive<Record<number, number>>({})
const labels: Record<ShipmentStatus, string> = {
  SHIPMENT_PREPARING: '출고 준비중',
  SHIPPED: '출고 완료',
}
watch(
  shipments,
  (values) => {
    for (const shipment of values) {
      drafts[shipment.shipmentSeq] = {
        status: shipment.status,
        deliveryCompanyCode: shipment.deliveryCompanyCode ?? '',
        trackingNumber: shipment.trackingNumber ?? '',
      }
      for (const item of shipment.items) quantities[item.shipmentItemSeq] = item.shipmentQuantity
    }
  },
  { immediate: true, flush: 'sync' },
)
async function load(
  requestedPage: unknown = shipmentsPagination.value.page,
  requestedSize = shipmentsPagination.value.size,
) {
  const page = typeof requestedPage === 'number' ? requestedPage : 0
  await Promise.all([
    store.fetchShipments({
      page,
      size: requestedSize,
      wholesaleStoreSeq: wholesaleStoreSeq.value || undefined,
      status: status.value || undefined,
    }),
    store.fetchDeliveryCompanies(),
  ]).catch(() => undefined)
}
const reset = () => {
  wholesaleStoreSeq.value = null
  status.value = ''
  load(0)
}
async function saveStatus(shipmentSeq: number) {
  const draft = drafts[shipmentSeq]
  if (!draft) return
  await store
    .updateShipmentStatus(
      shipmentSeq,
      draft.status,
      draft.deliveryCompanyCode.trim() || null,
      draft.trackingNumber.trim() || null,
    )
    .then(load)
    .catch(() => undefined)
}
const shipmentSaveDisabled = (shipmentSeq: number, currentStatus: ShipmentStatus) => {
  const draft = drafts[shipmentSeq]
  if (
    !draft ||
    currentStatus === 'SHIPPED' ||
    pendingKey.value === `shipment-status-${shipmentSeq}`
  )
    return true
  return (
    draft.status === 'SHIPPED' &&
    (!draft.deliveryCompanyCode.trim() || !draft.trackingNumber.trim())
  )
}
const isKnownDeliveryCompany = (code: string) =>
  deliveryCompanies.value.some((company) => company.code === code)
const saveQuantity = (shipmentSeq: number, itemSeq: number) =>
  store
    .updateShipmentQuantity(shipmentSeq, itemSeq, quantities[itemSeq] ?? 1)
    .catch(() => undefined)
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
        <p>WHOLESALE SHIPMENTS</p>
        <h1>출고 관리</h1>
        <span>자동 생성된 출고의 수량·택배사·송장·상태를 관리합니다.</span>
      </div>
      <div class="fulfillment-summary">
        <strong>{{ shipments.length }}</strong
        ><span>출고</span>
      </div>
    </header>

    <form class="admin-filter-panel fulfillment-filters" @submit.prevent="load(0)">
      <label
        ><span>내 도매 매장</span
        ><select v-model="wholesaleStoreSeq">
          <option :value="null">내 전체 매장</option>
          <option v-for="ownedStore in stores" :key="ownedStore.seq" :value="ownedStore.seq">
            {{ ownedStore.storeName }} (#{{ ownedStore.seq }})
          </option></select
        ><small>로그인 사용자가 소유한 매장만 표시됩니다.</small></label
      >
      <label
        ><span>출고 상태</span
        ><select v-model="status">
          <option value="">전체 상태</option>
          <option value="SHIPMENT_PREPARING">출고 준비중</option>
          <option value="SHIPPED">출고 완료</option>
        </select></label
      >
      <button class="admin-reset-button" type="button" @click="reset">↻ 초기화</button
      ><button class="admin-search-button" type="submit">검색</button>
    </form>

    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <div v-if="loading" class="admin-empty fulfillment-loading">출고 목록을 불러오는 중입니다.</div>
    <section v-else class="fulfillment-order-list">
      <article
        v-for="shipment in shipments"
        :key="shipment.shipmentSeq"
        class="fulfillment-order-card shipment-order-card"
      >
        <header>
          <div>
            <span>{{ shipment.orderNo }}</span
            ><strong>SHIPMENT #{{ shipment.shipmentSeq }}</strong>
          </div>
          <dl>
            <div>
              <dt>도매 매장</dt>
              <dd>{{ shipment.wholesaleStoreName ?? `#${shipment.wholesaleStoreSeq}` }}</dd>
            </div>
            <div>
              <dt>출고 상태</dt>
              <dd>
                <i class="admin-status">{{ labels[shipment.status] }}</i>
              </dd>
            </div>
            <div>
              <dt>출고일</dt>
              <dd>{{ formatDateTime(shipment.shippedAt) }}</dd>
            </div>
          </dl>
        </header>

        <div v-if="drafts[shipment.shipmentSeq]" class="shipment-fields shipment-order-fields">
          <label
            ><span>출고 상태</span
            ><select
              v-model="drafts[shipment.shipmentSeq]!.status"
              :disabled="shipment.status === 'SHIPPED'"
            >
              <option value="SHIPMENT_PREPARING">출고 준비중</option>
              <option value="SHIPPED">출고 완료</option>
            </select></label
          >
          <label
            ><span>택배사</span
            ><select
              v-model="drafts[shipment.shipmentSeq]!.deliveryCompanyCode"
              :disabled="shipment.status === 'SHIPPED'"
            >
              <option value="">택배사 선택</option>
              <option
                v-if="
                  drafts[shipment.shipmentSeq]!.deliveryCompanyCode &&
                  !isKnownDeliveryCompany(drafts[shipment.shipmentSeq]!.deliveryCompanyCode)
                "
                :value="drafts[shipment.shipmentSeq]!.deliveryCompanyCode"
              >
                {{ drafts[shipment.shipmentSeq]!.deliveryCompanyCode }} (기존 코드)
              </option>
              <option
                v-for="company in deliveryCompanies"
                :key="company.code"
                :value="company.code"
              >
                {{ company.name }} ({{ company.code }})
              </option>
            </select></label
          >
          <label
            ><span>송장번호</span
            ><input
              v-model="drafts[shipment.shipmentSeq]!.trackingNumber"
              :disabled="shipment.status === 'SHIPPED'"
          /></label>
          <button
            type="button"
            :disabled="shipmentSaveDisabled(shipment.shipmentSeq, shipment.status)"
            @click="saveStatus(shipment.shipmentSeq)"
          >
            출고 정보 저장
          </button>
        </div>

        <div class="admin-table-scroll">
          <table class="fulfillment-items-table shipment-items-table">
            <thead>
              <tr>
                <th>상품</th>
                <th>Product ID</th>
                <th>Variant ID</th>
                <th>주문 수량</th>
                <th>출고 수량</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in shipment.items" :key="item.shipmentItemSeq">
                <td>
                  <strong>{{ item.productName }}</strong
                  ><small>Order Item #{{ item.orderItemSeq }}</small>
                </td>
                <td>#{{ item.productSeq }}</td>
                <td>#{{ item.variantSeq }}</td>
                <td>{{ item.orderedQuantity }}개</td>
                <td>
                  <input
                    v-model.number="quantities[item.shipmentItemSeq]"
                    class="shipment-quantity-input"
                    type="number"
                    min="1"
                    :max="item.orderedQuantity"
                    :disabled="shipment.status !== 'SHIPMENT_PREPARING'"
                  />
                </td>
                <td>
                  <button
                    class="shipment-quantity-button"
                    type="button"
                    :disabled="
                      shipment.status !== 'SHIPMENT_PREPARING' ||
                      pendingKey === `shipment-item-${item.shipmentItemSeq}`
                    "
                    @click="saveQuantity(shipment.shipmentSeq, item.shipmentItemSeq)"
                  >
                    수량 저장
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
      <div v-if="!shipments.length" class="admin-empty fulfillment-loading">
        조건에 해당하는 출고가 없습니다.
      </div>
      <PageControls
        :page="shipmentsPagination.page"
        :size="shipmentsPagination.size"
        :total-pages="shipmentsPagination.totalPages"
        :total-elements="shipmentsPagination.totalElements"
        @change="load"
      />
    </section>
  </main>
</template>
