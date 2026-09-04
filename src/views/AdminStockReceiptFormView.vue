<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminProductsStore } from '../stores/adminProducts'
import { useAdminStockReceiptsStore } from '../stores/adminStockReceipts'
import type { AdminProduct, AdminProductVariant } from '../types/adminProduct'
import type { StockReceiptStatus } from '../types/adminStockReceipt'

const route = useRoute(); const router = useRouter(); const store = useAdminStockReceiptsStore(); const productsStore = useAdminProductsStore()
const { saving, error, fieldErrors } = storeToRefs(store); const { products, loading: productsLoading, error: productsError } = storeToRefs(productsStore)
const editSeq = computed(() => route.params.id ? Number(route.params.id) : undefined); const isEdit = computed(() => editSeq.value !== undefined)
const loading = ref(false); const pickerOpen = ref(false); const keyword = ref(''); const localError = ref(''); const completed = ref(false)
const form = reactive<{ variantSeq: string; quantity: number; memo: string; status: StockReceiptStatus }>({ variantSeq: '', quantity: 1, memo: '', status: 'REGISTERED' })
const selected = reactive({ sku: '', productName: '', option: '' })
type Candidate = { product: AdminProduct; variant: AdminProductVariant }
const candidates = computed<Candidate[]>(() => products.value.flatMap((product) => product.variants.map((variant) => ({ product, variant }))))
const filteredCandidates = computed(() => { const query = keyword.value.trim().toLowerCase(); return candidates.value.filter(({ product, variant }) => !query || [product.name, product.seq, variant.seq, variant.sku, variant.color, variant.size].some((value) => String(value ?? '').toLowerCase().includes(query))) })
const allowedStatuses = computed<StockReceiptStatus[]>(() => form.status === 'REGISTERED' ? ['REGISTERED', 'EXPECTED'] : ['EXPECTED', 'COMPLETED'])
const labels: Record<StockReceiptStatus, string> = { REGISTERED: '등록', EXPECTED: '입고예정', COMPLETED: '입고완료' }
async function initialize() {
  if (!editSeq.value) return
  loading.value = true
  try {
    const item = (await store.fetchReceipts()).find((candidate) => candidate.seq === editSeq.value)
    if (!item) { localError.value = '수정할 입고 정보를 찾을 수 없습니다.'; return }
    Object.assign(form, { variantSeq: String(item.variantSeq), quantity: item.quantity, memo: item.memo ?? '', status: item.status })
    Object.assign(selected, { sku: item.sku ?? '', productName: item.productName ?? '', option: [item.color, item.size].filter(Boolean).join(' / ') })
    completed.value = item.status === 'COMPLETED'
  } catch (cause) { if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } }) }
  finally { loading.value = false }
}
async function openPicker() {
  if (completed.value) return
  keyword.value = ''; pickerOpen.value = true
  try { await productsStore.fetchProducts({ page: 0, size: 100 }) }
  catch (cause) { if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } }) }
}
function choose({ product, variant }: Candidate) { form.variantSeq = String(variant.seq); Object.assign(selected, { sku: variant.sku, productName: product.name, option: [variant.color, variant.size].filter(Boolean).join(' / ') }); pickerOpen.value = false }
async function submit() {
  if (completed.value) return
  localError.value = ''; const variantSeq = Number(form.variantSeq); const quantity = Number(form.quantity)
  if (!Number.isInteger(variantSeq) || variantSeq < 1 || !Number.isInteger(quantity) || quantity < 1) { localError.value = 'SKU를 선택하고 입고 수량을 1 이상의 정수로 입력해 주세요.'; return }
  const common = { variantSeq, quantity, memo: form.memo.trim() || null }
  try { await store.saveReceipt(isEdit.value ? { ...common, status: form.status } : common, editSeq.value); await router.push('/admin/supplier/stock-receipts') }
  catch (cause) { if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } }) }
}
onMounted(initialize)
</script>

<template>
  <main class="admin-content admin-business-form-content"><nav class="admin-breadcrumbs"><RouterLink to="/admin/supplier/stock-receipts">입고 관리</RouterLink><span>›</span><strong>{{ isEdit ? (completed ? '상세' : '수정') : '등록' }}</strong></nav><div class="admin-page-heading admin-form-page-heading"><div><p>WHOLESALE STOCK RECEIPTS</p><h1>입고 {{ isEdit ? (completed ? '상세' : '수정') : '등록' }}</h1><span>{{ completed ? '완료된 입고는 재고에 반영되어 수정할 수 없습니다.' : '상품 SKU와 입고 수량을 입력하고 입고 상태를 관리합니다.' }}</span></div></div>
    <form class="admin-form-section admin-business-form" @submit.prevent="submit"><div class="admin-form-section-heading"><div><strong>입고 정보</strong><span>완료 전환 시 주문 가능 재고가 즉시 증가하며 되돌릴 수 없습니다.</span></div></div><p v-if="loading">입고 정보를 불러오는 중입니다.</p><div v-else class="admin-form-grid">
      <label class="admin-user-picker-field"><span>상품 SKU *</span><button type="button" class="admin-user-picker-button" :disabled="completed" @click="openPicker"><strong v-if="form.variantSeq">VARIANT {{ form.variantSeq }}</strong><span v-if="selected.sku">{{ selected.productName }} · {{ selected.sku }}<small v-if="selected.option">({{ selected.option }})</small></span><span v-else>상품 SKU 선택</span><b>{{ completed ? '변경 불가' : '검색' }}</b></button><small>{{ fieldErrors.variantSeq }}</small></label>
      <label><span>입고 수량 *</span><input v-model.number="form.quantity" type="number" min="1" step="1" required :readonly="completed" /><small>{{ fieldErrors.quantity }}</small></label>
      <label v-if="isEdit"><span>입고 상태 *</span><select v-model="form.status" required :disabled="completed"><option v-for="value in allowedStatuses" :key="value" :value="value">{{ labels[value] }} ({{ value }})</option></select><small>{{ fieldErrors.status }}</small></label>
      <label><span>메모</span><input v-model="form.memo" :readonly="completed" /><small>{{ fieldErrors.memo }}</small></label>
    </div><p v-if="localError || error" class="admin-form-error" role="alert">{{ localError || error }}</p><div class="admin-form-footer"><RouterLink to="/admin/supplier/stock-receipts">{{ completed ? '목록' : '취소' }}</RouterLink><button v-if="!completed" class="admin-primary-button" type="submit" :disabled="saving || loading">{{ saving ? '저장 중...' : isEdit ? '수정 저장' : '입고 등록' }}</button></div></form>
    <div v-if="pickerOpen" class="admin-modal-backdrop" role="presentation" @click.self="pickerOpen = false"><section class="admin-product-modal admin-user-picker-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-variant-title"><div class="admin-modal-heading"><div><p>PRODUCT VARIANT</p><h2 id="receipt-variant-title">입고 SKU 선택</h2></div><button type="button" aria-label="팝업 닫기" @click="pickerOpen = false">×</button></div><label class="admin-picker-search"><span>SKU 검색</span><input v-model="keyword" placeholder="Variant ID, SKU, 상품명, 색상, 사이즈" /></label><p v-if="productsError" class="admin-list-error">{{ productsError }}</p><div class="admin-user-picker-list"><p v-if="productsLoading">SKU 목록을 불러오는 중입니다.</p><button v-for="candidate in filteredCandidates" v-else :key="candidate.variant.seq" type="button" @click="choose(candidate)"><span><strong>{{ candidate.product.name }}</strong><small>{{ candidate.variant.sku }} · {{ [candidate.variant.color, candidate.variant.size].filter(Boolean).join(' / ') || '옵션 없음' }}</small></span><span><i>{{ candidate.variant.status }}</i><b>VARIANT {{ candidate.variant.seq }}</b></span></button><p v-if="!productsLoading && !filteredCandidates.length">조건에 맞는 SKU가 없습니다.</p></div></section></div>
  </main>
</template>
