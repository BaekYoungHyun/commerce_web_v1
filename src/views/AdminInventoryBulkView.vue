<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminInventoryStore } from '../stores/adminInventory'
import { useAdminProductsStore } from '../stores/adminProducts'
import type { AdminInventoryBulkItemRequest } from '../types/adminInventory'

type Row = AdminInventoryBulkItemRequest & { key: string; label: string }
const route = useRoute()
const router = useRouter()
const store = useAdminInventoryStore()
const productStore = useAdminProductsStore()
const { loading, saving, error } = storeToRefs(store)
const { products, loading: productsLoading } = storeToRefs(productStore)
const rows = reactive<Row[]>([])
const localError = ref('')
const pickerOpen = ref(false)
const pickerKeyword = ref('')
const selectedVariantSeqs = ref<Set<number>>(new Set())
let key = 0
const variants = computed(() =>
  products.value.flatMap((product) =>
    product.variants.map((variant) => ({
      seq: variant.seq,
      productName: product.name,
      productStatus: product.status,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      status: variant.status,
      label: `${product.name} · ${variant.sku} · ${[variant.color, variant.size].filter(Boolean).join(' / ') || '옵션 없음'}`,
    })),
  ),
)
const pickerVariants = computed(() => {
  const existing = new Set(rows.map((row) => Number(row.variantSeq)).filter(Boolean))
  const query = pickerKeyword.value.trim().toLowerCase()
  return variants.value.filter((variant) => {
    if (existing.has(variant.seq)) return false
    if (!query) return true
    return [variant.seq, variant.productName, variant.productStatus, variant.sku, variant.color, variant.size, variant.status]
      .some((value) => String(value ?? '').toLowerCase().includes(query))
  })
})

function openPicker() {
  pickerKeyword.value = ''
  selectedVariantSeqs.value = new Set()
  pickerOpen.value = true
}
function toggleVariant(seq: number) {
  const next = new Set(selectedVariantSeqs.value)
  if (next.has(seq)) next.delete(seq)
  else next.add(seq)
  selectedVariantSeqs.value = next
}
function addSelectedVariants() {
  variants.value
    .filter((variant) => selectedVariantSeqs.value.has(variant.seq))
    .forEach((variant) => rows.push({
      key: `new-${key++}`,
      variantSeq: variant.seq,
      availableQuantity: 0,
      reservedQuantity: 0,
      label: variant.label,
    }))
  pickerOpen.value = false
}
async function initialize() {
  try {
    const [inventory] = await Promise.all([
      store.fetchInventory(),
      productStore.fetchProducts({ page: 0, size: 100 }),
    ])
    rows.splice(
      0,
      rows.length,
      ...inventory.map((item) => ({
        key: `saved-${item.seq}`,
        seq: item.seq,
        variantSeq: item.variantSeq,
        availableQuantity: item.availableQuantity,
        reservedQuantity: item.reservedQuantity,
        label: `${item.productName ?? '상품'} · ${item.sku ?? `Variant ${item.variantSeq}`}`,
      })),
    )
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}
function validate() {
  if (!rows.length) return '저장할 재고 행을 한 개 이상 추가해 주세요.'
  if (
    rows.some(
      (row) =>
        !Number.isInteger(Number(row.variantSeq)) ||
        Number(row.variantSeq) < 1 ||
        !Number.isInteger(Number(row.availableQuantity)) ||
        Number(row.availableQuantity) < 0 ||
        !Number.isInteger(Number(row.reservedQuantity)) ||
        Number(row.reservedQuantity) < 0,
    )
  )
    return '모든 SKU를 선택하고 수량을 0 이상의 정수로 입력해 주세요.'
  const seqs = rows.flatMap((row) => (row.seq ? [row.seq] : []))
  if (new Set(seqs).size !== seqs.length) return '동일한 재고 행이 중복되었습니다.'
  const variants = rows.map((row) => Number(row.variantSeq))
  if (new Set(variants).size !== variants.length) return '동일한 SKU를 두 번 저장할 수 없습니다.'
  return ''
}
async function submit() {
  localError.value = validate()
  if (localError.value) return
  try {
    await store.bulkUpsert({
      items: rows.map((row) => ({
        ...(row.seq ? { seq: row.seq } : {}),
        variantSeq: Number(row.variantSeq),
        availableQuantity: Number(row.availableQuantity),
        reservedQuantity: Number(row.reservedQuantity),
      })),
    })
    await router.push('/admin/supplier/inventory')
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}
onMounted(initialize)
</script>

<template>
  <main class="admin-content admin-list-content">
    <nav class="admin-breadcrumbs">
      <RouterLink to="/admin/supplier/inventory">재고 관리</RouterLink><span>›</span
      ><strong>일괄 관리</strong>
    </nav>
    <div class="admin-page-heading">
      <div>
        <p>WHOLESALE INVENTORY BULK</p>
        <h1>재고 일괄 관리</h1>
        <span>기존 재고 수정과 신규 SKU 재고 등록을 한 번의 요청으로 처리합니다.</span>
      </div>
      <div class="admin-heading-actions">
        <button class="admin-primary-button" type="button" @click="openPicker">+ SKU 여러 개 선택</button>
      </div>
    </div>
    <p class="admin-api-note">
      한 행이라도 저장에 실패하면 전체 요청이 롤백됩니다. 화면에서 제거한 기존 행은 삭제되지 않으며
      이번 저장 요청에서만 제외됩니다.
    </p>
    <p v-if="localError || error" class="admin-list-error" role="alert">
      {{ localError || error }}
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>일괄 저장 항목</h2>
          <span>{{ rows.length }}개</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table inventory-bulk-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>상품 SKU</th>
              <th>주문 가능</th>
              <th>예약</th>
              <th>전체</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="admin-empty">재고와 SKU 목록을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="(row, index) in rows" v-else :key="row.key">
              <td>{{ row.seq ? `재고 #${row.seq}` : '신규' }}</td>
              <td><div class="inventory-sku-readonly"><strong>{{ row.label || variants.find((item) => item.seq === row.variantSeq)?.label || `Variant ${row.variantSeq}` }}</strong><small>VARIANT {{ row.variantSeq }} · SKU 변경 불가</small></div></td>
              <td>
                <input v-model.number="row.availableQuantity" min="0" step="1" type="number" />
              </td>
              <td>
                <input v-model.number="row.reservedQuantity" min="0" step="1" type="number" />
              </td>
              <td>
                <strong>{{
                  Number(row.availableQuantity || 0) + Number(row.reservedQuantity || 0)
                }}</strong>
              </td>
              <td>
                <button class="product-row-delete" type="button" @click="rows.splice(index, 1)">
                  제외
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="6" class="admin-empty">
                신규 행을 추가하거나 목록으로 돌아가 재고를 등록해 주세요.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="admin-form-footer inventory-bulk-footer">
        <RouterLink to="/admin/supplier/inventory">취소</RouterLink
        ><button
          class="admin-primary-button"
          type="button"
          :disabled="saving || loading"
          @click="submit"
        >
          {{ saving ? '일괄 저장 중...' : `${rows.length}개 일괄 저장` }}
        </button>
      </div>
    </section>
    <div v-if="pickerOpen" class="admin-modal-backdrop" role="presentation" @click.self="pickerOpen = false">
      <section class="admin-product-modal inventory-multi-picker" role="dialog" aria-modal="true" aria-labelledby="inventory-picker-title">
        <div class="admin-modal-heading">
          <div><p>PRODUCT SKU MULTI SELECT</p><h2 id="inventory-picker-title">상품 SKU 여러 개 선택</h2></div>
          <button type="button" aria-label="팝업 닫기" @click="pickerOpen = false">×</button>
        </div>
        <p class="admin-picker-guide">재고 행으로 추가할 상품 SKU를 체크하세요. 이미 화면에 있는 SKU는 목록에서 제외됩니다.</p>
        <label class="admin-picker-search"><span>상품·SKU 검색</span><input v-model="pickerKeyword" placeholder="상품명, SKU, 색상, 사이즈, 상태, Variant ID" /></label>
        <div class="inventory-picker-toolbar"><span>검색 결과 {{ pickerVariants.length }}개</span><strong>{{ selectedVariantSeqs.size }}개 선택</strong></div>
        <div class="inventory-multi-list">
          <label v-for="variant in pickerVariants" :key="variant.seq" :class="{ selected: selectedVariantSeqs.has(variant.seq) }">
            <input type="checkbox" :checked="selectedVariantSeqs.has(variant.seq)" @change="toggleVariant(variant.seq)" />
            <span><strong>{{ variant.productName }}</strong><small>{{ variant.sku }} · {{ [variant.color, variant.size].filter(Boolean).join(' / ') || '옵션 없음' }}</small></span>
            <span><i>{{ variant.status }}</i><b>VARIANT {{ variant.seq }}</b></span>
          </label>
          <p v-if="!productsLoading && pickerVariants.length === 0">추가할 수 있는 SKU가 없습니다.</p>
        </div>
        <div class="admin-modal-actions"><button type="button" @click="pickerOpen = false">취소</button><button class="admin-primary-button" type="button" :disabled="selectedVariantSeqs.size === 0" @click="addSelectedVariants">{{ selectedVariantSeqs.size }}개 행 추가</button></div>
      </section>
    </div>
  </main>
</template>
