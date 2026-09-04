<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminInventoryStore } from '../stores/adminInventory'
import { useAdminProductsStore } from '../stores/adminProducts'
import type { AdminProduct, AdminProductVariant } from '../types/adminProduct'

const route = useRoute()
const router = useRouter()
const store = useAdminInventoryStore()
const productsStore = useAdminProductsStore()
const { saving, error, fieldErrors } = storeToRefs(store)
const { products, loading: productsLoading, error: productsError } = storeToRefs(productsStore)
const editSeq = computed(() => (route.params.id ? Number(route.params.id) : undefined))
const isEdit = computed(() => editSeq.value !== undefined)
const loading = ref(false)
const pickerOpen = ref(false)
const keyword = ref('')
const localError = ref('')
const form = reactive({ variantSeq: '', availableQuantity: 0, reservedQuantity: 0 })
const selectedVariant = reactive({ sku: '', productName: '', option: '', status: '' })
type VariantCandidate = { product: AdminProduct; variant: AdminProductVariant }
const candidates = computed<VariantCandidate[]>(() =>
  products.value.flatMap((product) => product.variants.map((variant) => ({ product, variant }))),
)
const filteredCandidates = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return candidates.value
  return candidates.value.filter(({ product, variant }) =>
    [
      product.seq,
      product.name,
      product.wholesaleStoreSeq,
      variant.seq,
      variant.sku,
      variant.color,
      variant.size,
      variant.status,
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(query),
    ),
  )
})

async function initialize() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const rows = await store.fetchInventory()
    const item = rows.find((row) => row.seq === editSeq.value)
    if (!item) {
      localError.value = '수정할 재고를 찾을 수 없습니다.'
      return
    }
    Object.assign(form, {
      variantSeq: String(item.variantSeq),
      availableQuantity: item.availableQuantity,
      reservedQuantity: item.reservedQuantity,
    })
    Object.assign(selectedVariant, {
      sku: item.sku ?? '',
      productName: item.productName ?? '',
      option: [item.color, item.size].filter(Boolean).join(' / '),
      status: item.variantStatus ?? '',
    })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  } finally {
    loading.value = false
  }
}
async function openPicker() {
  if (isEdit.value) return
  keyword.value = ''
  pickerOpen.value = true
  try {
    await productsStore.fetchProducts({ page: 0, size: 100 })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}
function choose({ product, variant }: VariantCandidate) {
  form.variantSeq = String(variant.seq)
  Object.assign(selectedVariant, {
    sku: variant.sku,
    productName: product.name,
    option: [variant.color, variant.size].filter(Boolean).join(' / '),
    status: variant.status,
  })
  pickerOpen.value = false
}
async function submit() {
  localError.value = ''
  const body = {
    variantSeq: Number(form.variantSeq),
    availableQuantity: Number(form.availableQuantity),
    reservedQuantity: Number(form.reservedQuantity),
  }
  if (
    !Number.isInteger(body.variantSeq) ||
    body.variantSeq < 1 ||
    !Number.isInteger(body.availableQuantity) ||
    body.availableQuantity < 0 ||
    !Number.isInteger(body.reservedQuantity) ||
    body.reservedQuantity < 0
  ) {
    localError.value = 'SKU를 선택하고 수량을 0 이상의 정수로 입력해 주세요.'
    return
  }
  try {
    await store.saveInventory(body, editSeq.value)
    await router.push('/admin/supplier/inventory')
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}
onMounted(initialize)
</script>

<template>
  <main class="admin-content admin-business-form-content">
    <nav class="admin-breadcrumbs">
      <RouterLink to="/admin/supplier/inventory">재고 관리</RouterLink><span>›</span
      ><strong>{{ isEdit ? '수정' : '등록' }}</strong>
    </nav>
    <div class="admin-page-heading admin-form-page-heading">
      <div>
        <p>WHOLESALE INVENTORY</p>
        <h1>재고 {{ isEdit ? '수정' : '등록' }}</h1>
        <span>SKU를 선택하고 주문 가능·예약 수량을 입력합니다.</span>
      </div>
    </div>
    <form class="admin-form-section admin-business-form" @submit.prevent="submit">
      <div class="admin-form-section-heading">
        <div>
          <strong>SKU 재고 정보</strong
          ><span>두 수량은 0 이상의 정수이며 전체 수량은 서버가 계산합니다.</span>
        </div>
      </div>
      <p v-if="loading">재고 정보를 불러오는 중입니다.</p>
      <div v-else class="admin-form-grid">
        <label class="admin-user-picker-field"
          ><span>상품 SKU *</span
          ><button
            type="button"
            class="admin-user-picker-button"
            :disabled="isEdit"
            @click="openPicker"
          >
            <strong v-if="form.variantSeq">VARIANT {{ form.variantSeq }}</strong
            ><span v-if="selectedVariant.sku"
              >{{ selectedVariant.productName }} · {{ selectedVariant.sku
              }}<small v-if="selectedVariant.option">({{ selectedVariant.option }})</small></span
            ><span v-else>상품 SKU 선택</span><b>{{ isEdit ? '변경 불가' : '검색' }}</b></button
          ><small>{{
            isEdit ? '등록된 재고의 상품 SKU는 수정할 수 없습니다.' : fieldErrors.variantSeq
          }}</small></label
        ><label
          ><span>주문 가능 수량 *</span
          ><input
            v-model.number="form.availableQuantity"
            min="0"
            step="1"
            type="number"
            required
          /><small>{{ fieldErrors.availableQuantity }}</small></label
        ><label
          ><span>예약 수량 *</span
          ><input
            v-model.number="form.reservedQuantity"
            min="0"
            step="1"
            type="number"
            required
          /><small>{{ fieldErrors.reservedQuantity }}</small></label
        ><label
          ><span>예상 전체 수량</span
          ><input
            :value="Number(form.availableQuantity || 0) + Number(form.reservedQuantity || 0)"
            readonly
          /><small>서버 응답의 totalQuantity가 최종 기준입니다.</small></label
        >
      </div>
      <p v-if="localError || error" class="admin-form-error" role="alert">
        {{ localError || error }}
      </p>
      <div class="admin-form-footer">
        <RouterLink to="/admin/supplier/inventory">취소</RouterLink
        ><button class="admin-primary-button" type="submit" :disabled="saving || loading">
          {{ saving ? '저장 중...' : isEdit ? '수정 저장' : '등록' }}
        </button>
      </div>
    </form>
    <div
      v-if="pickerOpen"
      class="admin-modal-backdrop"
      role="presentation"
      @click.self="pickerOpen = false"
    >
      <section
        class="admin-product-modal admin-user-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-picker-title"
      >
        <div class="admin-modal-heading">
          <div>
            <p>PRODUCT VARIANT</p>
            <h2 id="variant-picker-title">상품 SKU 선택</h2>
          </div>
          <button type="button" aria-label="팝업 닫기" @click="pickerOpen = false">×</button>
        </div>
        <p class="admin-picker-guide">
          최근 상품 최대 100개의 SKU 중 재고를 연결할 항목을 선택하세요.
        </p>
        <label class="admin-picker-search"
          ><span>SKU 검색</span
          ><input v-model="keyword" placeholder="Variant ID, SKU, 상품명, 색상, 사이즈, 상태"
        /></label>
        <p v-if="productsError" class="admin-list-error">{{ productsError }}</p>
        <div class="admin-user-picker-list">
          <p v-if="productsLoading">SKU 목록을 불러오는 중입니다.</p>
          <button
            v-for="candidate in filteredCandidates"
            v-else
            :key="candidate.variant.seq"
            type="button"
            :class="{ selected: Number(form.variantSeq) === candidate.variant.seq }"
            @click="choose(candidate)"
          >
            <span
              ><strong>{{ candidate.product.name }}</strong
              ><small
                >{{ candidate.variant.sku }} ·
                {{
                  [candidate.variant.color, candidate.variant.size].filter(Boolean).join(' / ') ||
                  '옵션 없음'
                }}</small
              ></span
            ><span
              ><i>{{ candidate.variant.status }}</i
              ><b>VARIANT {{ candidate.variant.seq }}</b></span
            >
          </button>
          <p v-if="!productsLoading && filteredCandidates.length === 0">
            조건에 맞는 SKU가 없습니다.
          </p>
        </div>
      </section>
    </div>
  </main>
</template>
