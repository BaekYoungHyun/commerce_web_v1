<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useWholesaleFulfillmentStore } from '../stores/wholesaleFulfillment'
import type { Shipment, ShipmentStatus } from '../types/wholesaleFulfillment'
import { formatDateTime } from '../utils/dateTime'
import PageControls from '../components/PageControls.vue'

const store = useWholesaleFulfillmentStore()
const { stores, shipments, shipmentsPagination, deliveryCompanies, loading, pendingKey, error } =
  storeToRefs(store)
const wholesaleStoreSeq = ref<number | null>(null)
const status = ref('')
const selectedShipmentSeqs = ref<number[]>([])
const bulkFeedback = ref('')
const activeShipmentSeq = ref<number | null>(null)
const drafts = reactive<
  Record<number, { status: ShipmentStatus; deliveryCompanyCode: string; trackingNumber: string }>
>({})
const quantities = reactive<Record<number, number>>({})
const labels: Record<ShipmentStatus, string> = {
  SHIPMENT_PREPARING: '출고 준비중',
  SHIPPED: '출고 완료',
}
const activeShipment = computed(
  () =>
    shipments.value.find((shipment) => shipment.shipmentSeq === activeShipmentSeq.value) ?? null,
)
const itemSummary = (shipment: Shipment) => {
  const first = shipment.items[0]
  if (!first) return '품목 없음'
  return shipment.items.length === 1
    ? first.productName
    : `${first.productName} 외 ${shipment.items.length - 1}건`
}
const quantitySummary = (shipment: Shipment) =>
  `${shipment.items.reduce((sum, item) => sum + item.shipmentQuantity, 0)} / ${shipment.items.reduce((sum, item) => sum + item.orderedQuantity, 0)}개`
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
      'SHIPPED',
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
  return !draft.deliveryCompanyCode.trim() || !draft.trackingNumber.trim()
}
const isKnownDeliveryCompany = (code: string) =>
  deliveryCompanies.value.some((company) => company.code === code)
const trackingUrl = (deliveryCompanyCode: string | null, trackingNumber: string | null) => {
  if (!deliveryCompanyCode || !trackingNumber) return null
  const template = deliveryCompanies.value.find(
    (company) => company.code === deliveryCompanyCode,
  )?.trackingUrlTemplate
  if (!template || !/^https?:\/\//i.test(template)) return null
  return template.replace('{trackingNumber}', encodeURIComponent(trackingNumber))
}
const saveBulkStatus = async () => {
  const selected = shipments.value
    .filter(
      (shipment) =>
        selectedShipmentSeqs.value.includes(shipment.shipmentSeq) &&
        shipment.status === 'SHIPMENT_PREPARING',
    )
    .map((shipment) => ({ shipment, draft: drafts[shipment.shipmentSeq] }))
  const invalid = selected.filter(
    ({ draft }) => !draft?.deliveryCompanyCode.trim() || !draft.trackingNumber.trim(),
  )
  if (!selected.length || invalid.length) {
    bulkFeedback.value = invalid.length
      ? '선택한 모든 출고에 택배사와 송장번호를 입력해 주세요.'
      : '출고 준비중인 항목을 선택해 주세요.'
    return
  }
  bulkFeedback.value = ''
  await store
    .updateShipmentStatuses({
      status: 'SHIPPED',
      shipments: selected.map(({ shipment, draft }) => ({
        shipmentSeq: shipment.shipmentSeq,
        deliveryCompanyCode: draft!.deliveryCompanyCode.trim(),
        trackingNumber: draft!.trackingNumber.trim(),
      })),
    })
    .then((response) => {
      const failedSeqs = new Set(response.failed.map((item) => item.seq))
      selectedShipmentSeqs.value = selectedShipmentSeqs.value.filter((seq) => failedSeqs.has(seq))
      bulkFeedback.value = response.failed.length
        ? `${response.succeeded.length}건 성공, ${response.failed.length}건 실패: ${response.failed.map((item) => item.message).join(', ')}`
        : `${response.succeeded.length}건의 출고를 완료했습니다.`
    })
    .catch(() => undefined)
}
const saveQuantity = (shipmentSeq: number, itemSeq: number) =>
  store
    .updateShipmentQuantity(shipmentSeq, itemSeq, quantities[itemSeq] ?? 1)
    .catch(() => undefined)
const openItems = (shipmentSeq: number) => {
  activeShipmentSeq.value = shipmentSeq
}
const closeItems = () => {
  activeShipmentSeq.value = null
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
        <p>WHOLESALE SHIPMENTS</p>
        <h1>출고 관리</h1>
        <span>상품 SKU·옵션을 확인하고 출고 수량·택배사·송장·상태를 관리합니다.</span>
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
            {{ ownedStore.businessProfileName ?? '사업자명 없음' }} · {{ ownedStore.storeName }} ({{
              ownedStore.userId ?? '사용자 미연결'
            }})
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

    <div class="fulfillment-bulk-bar">
      <strong>선택 {{ selectedShipmentSeqs.length }}건</strong>
      <span>각 출고의 택배사·송장번호를 확인한 뒤 일괄 완료합니다.</span>
      <button
        type="button"
        :disabled="!selectedShipmentSeqs.length || pendingKey === 'shipments-bulk'"
        @click="saveBulkStatus"
      >
        선택 출고 일괄 완료
      </button>
    </div>
    <p v-if="bulkFeedback" class="admin-list-message" role="status">{{ bulkFeedback }}</p>

    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <div v-if="loading" class="admin-empty fulfillment-loading">출고 목록을 불러오는 중입니다.</div>
    <section v-else class="shipment-list-panel">
      <div class="admin-table-scroll">
        <table class="shipment-list-table">
          <thead>
            <tr>
              <th>선택</th>
              <th>출고 / 주문</th>
              <th>도매 매장</th>
              <th>상품</th>
              <th>수량</th>
              <th>상태</th>
              <th>택배사</th>
              <th>송장번호</th>
              <th>출고일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="shipment in shipments" :key="shipment.shipmentSeq">
              <td>
                <input
                  v-model="selectedShipmentSeqs"
                  type="checkbox"
                  :value="shipment.shipmentSeq"
                  :disabled="shipment.status === 'SHIPPED'"
                  :aria-label="`출고 ${shipment.shipmentSeq} 선택`"
                />
              </td>
              <td>
                <strong>#{{ shipment.shipmentSeq }}</strong>
                <small>{{ shipment.orderNo }}</small>
              </td>
              <td>{{ shipment.wholesaleStoreName ?? `#${shipment.wholesaleStoreSeq}` }}</td>
              <td>
                <button
                  class="shipment-product-button"
                  type="button"
                  @click="openItems(shipment.shipmentSeq)"
                >
                  {{ itemSummary(shipment) }}
                </button>
              </td>
              <td>{{ quantitySummary(shipment) }}</td>
              <td>
                <i class="admin-status">{{ labels[shipment.status] }}</i>
              </td>
              <td>
                <select
                  v-if="drafts[shipment.shipmentSeq]"
                  v-model="drafts[shipment.shipmentSeq]!.deliveryCompanyCode"
                  :disabled="shipment.status === 'SHIPPED'"
                  :aria-label="`출고 ${shipment.shipmentSeq} 택배사`"
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
                    {{ company.name }}
                  </option>
                </select>
              </td>
              <td>
                <input
                  v-if="drafts[shipment.shipmentSeq]"
                  v-model="drafts[shipment.shipmentSeq]!.trackingNumber"
                  :disabled="shipment.status === 'SHIPPED'"
                  :aria-label="`출고 ${shipment.shipmentSeq} 송장번호`"
                  placeholder="송장번호"
                />
                <a
                  v-if="trackingUrl(shipment.deliveryCompanyCode, shipment.trackingNumber)"
                  :href="trackingUrl(shipment.deliveryCompanyCode, shipment.trackingNumber)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  >배송조회</a
                >
              </td>
              <td>{{ formatDateTime(shipment.shippedAt) }}</td>
              <td>
                <div class="shipment-row-actions">
                  <button type="button" @click="openItems(shipment.shipmentSeq)">품목</button>
                  <button
                    v-if="drafts[shipment.shipmentSeq]"
                    type="button"
                    :disabled="shipmentSaveDisabled(shipment.shipmentSeq, shipment.status)"
                    @click="saveStatus(shipment.shipmentSeq)"
                  >
                    출고 완료
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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

    <div v-if="activeShipment" class="admin-modal-backdrop" @click.self="closeItems">
      <section
        class="admin-product-modal shipment-items-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipment-items-title"
      >
        <header class="admin-modal-heading">
          <div>
            <p>SHIPMENT ITEMS</p>
            <h2 id="shipment-items-title">출고 #{{ activeShipment.shipmentSeq }} 품목 관리</h2>
          </div>
          <button type="button" aria-label="품목 관리 닫기" @click="closeItems">×</button>
        </header>
        <div class="admin-table-scroll">
          <table class="fulfillment-items-table shipment-items-table">
            <thead>
              <tr>
                <th>상품</th>
                <th>SKU</th>
                <th>옵션</th>
                <th>주문 수량</th>
                <th>출고 수량</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in activeShipment.items" :key="item.shipmentItemSeq">
                <td>
                  <strong>{{ item.productName }}</strong>
                  <small>Product #{{ item.productSeq }} · Variant #{{ item.variantSeq }}</small>
                </td>
                <td>{{ item.sku || '-' }}</td>
                <td>{{ [item.color, item.size].filter(Boolean).join(' / ') || '-' }}</td>
                <td>{{ item.orderedQuantity }}개</td>
                <td>
                  <input
                    v-model.number="quantities[item.shipmentItemSeq]"
                    class="shipment-quantity-input"
                    type="number"
                    min="1"
                    :max="item.orderedQuantity"
                    :disabled="activeShipment.status !== 'SHIPMENT_PREPARING'"
                  />
                </td>
                <td>
                  <button
                    class="shipment-quantity-button"
                    type="button"
                    :disabled="
                      activeShipment.status !== 'SHIPMENT_PREPARING' ||
                      pendingKey === `shipment-item-${item.shipmentItemSeq}`
                    "
                    @click="saveQuantity(activeShipment.shipmentSeq, item.shipmentItemSeq)"
                  >
                    수량 저장
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>
