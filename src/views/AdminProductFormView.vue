<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminProductsStore } from '../stores/adminProducts'
import type { AdminProductImageRequest, AdminProductOptionRequest, AdminProductVariantRequest } from '../types/adminProduct'

const route = useRoute()
const router = useRouter()
const store = useAdminProductsStore()
const { saving, loading, fieldErrors } = storeToRefs(store)
const productId = computed(() => Number(route.params.id))
const isEditing = computed(() => route.name === 'supplier-admin-product-edit')
const submitError = ref('')
const form = reactive({
  wholesaleStoreId: null as number | null,
  categorySeq: null as number | null,
  name: '',
  description: '',
  status: 'DRAFT',
  minOrderQuantity: 1,
  images: [] as AdminProductImageRequest[],
  options: [] as AdminProductOptionRequest[],
  variants: [] as AdminProductVariantRequest[],
})

const addImage = () => form.images.push({ imageUrl: '', imageType: 'DETAIL', sortOrder: form.images.length })
const addOption = () => form.options.push({ optionName: '', optionValue: '', sortOrder: form.options.length })
const addVariant = () => form.variants.push({ sku: '', color: null, size: null, supplyPrice: 0, salePrice: 0, status: 'ACTIVE' })

async function loadForEdit() {
  if (!isEditing.value) return
  try {
    const product = await store.fetchProduct(productId.value)
    Object.assign(form, {
      wholesaleStoreId: product.wholesaleStoreId,
      categorySeq: product.categorySeq,
      name: product.name,
      description: product.description ?? '',
      status: product.status,
      minOrderQuantity: product.minOrderQuantity,
      images: product.images.map((item) => ({ ...item })),
      options: product.options.map((item) => ({ ...item })),
      variants: product.variants.map((item) => ({ ...item })),
    })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404 && cause.code === 'P001') await router.replace('/admin/supplier/products')
    else if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

async function submit() {
  submitError.value = ''
  if (form.wholesaleStoreId === null || form.categorySeq === null || !form.name.trim()) { submitError.value = '도매상 ID, 카테고리 ID, 상품명을 입력해 주세요.'; return }
  if (form.images.some((item) => !item.imageUrl.trim()) || form.options.some((item) => !item.optionName.trim() || !item.optionValue.trim()) || form.variants.some((item) => !item.sku.trim())) { submitError.value = '추가한 이미지, 옵션, SKU의 필수값을 입력해 주세요.'; return }
  const payload = {
    wholesaleStoreId: form.wholesaleStoreId,
    categorySeq: form.categorySeq,
    name: form.name.trim(),
    description: form.description.trim() || null,
    status: form.status.trim() || 'DRAFT',
    minOrderQuantity: form.minOrderQuantity,
    images: form.images.map((item, index) => ({ ...item, imageUrl: item.imageUrl.trim(), imageType: item.imageType?.trim() || 'DETAIL', sortOrder: item.sortOrder ?? index })),
    options: form.options.map((item, index) => ({ ...item, optionName: item.optionName.trim(), optionValue: item.optionValue.trim(), sortOrder: item.sortOrder ?? index })),
    variants: form.variants.map((item) => ({ ...item, sku: item.sku.trim(), color: item.color?.trim() || null, size: item.size?.trim() || null, status: item.status?.trim() || 'ACTIVE' })),
  }
  try {
    const product = isEditing.value ? await store.updateProduct(productId.value, payload) : await store.createProduct(payload)
    await router.push(`/admin/supplier/products/${product.seq}`)
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 403) submitError.value = '상품을 저장할 권한이 없습니다.'
    else if (cause instanceof ApiError && cause.status === 401) { await router.push({ path: '/login', query: { redirect: route.fullPath } }); return }
    else if (cause instanceof ApiError && cause.status === 404 && cause.code === 'P001') { await router.replace('/admin/supplier/products'); return }
    else submitError.value = cause instanceof Error ? cause.message : '상품 저장에 실패했습니다.'
  }
}

onMounted(loadForEdit)
</script>

<template>
  <main class="admin-content">
    <nav class="admin-breadcrumbs" aria-label="현재 위치"><RouterLink to="/admin/supplier/products">상품 관리</RouterLink><span>›</span><strong>{{ isEditing ? '상품 수정' : '상품 등록' }}</strong></nav>
    <div class="admin-page-heading admin-form-page-heading"><div><p>{{ isEditing ? 'EDIT WHOLESALE PRODUCT' : 'NEW WHOLESALE PRODUCT' }}</p><h1>{{ isEditing ? '도매 상품 수정' : '도매 상품 등록' }}</h1><span>백엔드 상품 API 계약에 정의된 정보를 입력합니다.</span></div></div>
    <section v-if="loading" class="admin-not-found"><strong>상품 정보를 불러오는 중입니다.</strong></section>
    <form v-else class="admin-full-product-form" @submit.prevent="submit">
      <section class="admin-form-section">
        <div class="admin-form-section-heading"><div><strong>상품 기본 정보</strong><span>도매상, 카테고리와 상품 노출 정보를 설정합니다.</span></div><b>01</b></div>
        <div class="admin-full-form-grid">
          <label>도매상 ID <em>필수</em><input v-model.number="form.wholesaleStoreId" required min="1" type="number" /><small v-if="fieldErrors.wholesaleStoreId" class="field-error">{{ fieldErrors.wholesaleStoreId }}</small></label>
          <label>카테고리 ID <em>필수</em><input v-model.number="form.categorySeq" required min="1" type="number" /><small v-if="fieldErrors.categorySeq" class="field-error">{{ fieldErrors.categorySeq }}</small></label>
          <label class="wide">상품명 <em>필수</em><input v-model="form.name" required maxlength="200" placeholder="상품명을 입력하세요" /><small v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</small></label>
          <label>상품 상태<input v-model="form.status" maxlength="30" placeholder="DRAFT" /><small v-if="fieldErrors.status" class="field-error">{{ fieldErrors.status }}</small><small>허용 상태가 확정되지 않아 서버 값을 그대로 사용합니다.</small></label>
          <label>최소 주문 수량 <em>필수</em><div class="admin-input-unit"><input v-model.number="form.minOrderQuantity" required min="1" type="number" /><span>개</span></div><small v-if="fieldErrors.minOrderQuantity" class="field-error">{{ fieldErrors.minOrderQuantity }}</small></label>
        </div>
      </section>
      <section class="admin-form-section">
        <div class="admin-form-section-heading"><div><strong>상품 설명</strong><span>빈 값은 서버에 null로 전달합니다.</span></div><b>02</b></div>
        <label class="admin-description-field">상세 설명<textarea v-model="form.description" rows="9" placeholder="상품 상세 설명을 입력하세요."></textarea><small v-if="fieldErrors.description" class="field-error">{{ fieldErrors.description }}</small></label>
      </section>
      <section class="admin-form-section">
        <div class="admin-form-section-heading"><div><strong>이미지</strong><span>업로드가 완료된 URL을 순서대로 입력합니다.</span></div><button type="button" class="admin-reset-button" @click="addImage">+ 이미지</button></div>
        <div v-for="(image, index) in form.images" :key="image.seq ?? `image-${index}`" class="admin-full-form-grid">
          <label class="wide">이미지 URL <em>필수</em><input v-model="image.imageUrl" required type="url" /><small v-if="fieldErrors[`images[${index}].imageUrl`]" class="field-error">{{ fieldErrors[`images[${index}].imageUrl`] }}</small></label>
          <label>이미지 타입<input v-model="image.imageType" maxlength="30" /></label><label>정렬 순서<input v-model.number="image.sortOrder" min="0" type="number" /></label><button type="button" class="admin-reset-button" @click="form.images.splice(index, 1)">삭제</button>
        </div>
        <p v-if="!form.images.length" class="admin-api-note">이미지는 선택 사항이며 빈 배열로 등록할 수 있습니다.</p>
      </section>
      <section class="admin-form-section">
        <div class="admin-form-section-heading"><div><strong>옵션</strong><span>상품 선택에 사용할 옵션 이름과 값을 입력합니다.</span></div><button type="button" class="admin-reset-button" @click="addOption">+ 옵션</button></div>
        <div v-for="(option, index) in form.options" :key="option.seq ?? `option-${index}`" class="admin-full-form-grid">
          <label>옵션명 <em>필수</em><input v-model="option.optionName" required maxlength="50" /></label><label>옵션값 <em>필수</em><input v-model="option.optionValue" required maxlength="100" /></label><label>정렬 순서<input v-model.number="option.sortOrder" min="0" type="number" /></label><button type="button" class="admin-reset-button" @click="form.options.splice(index, 1)">삭제</button>
        </div>
        <p v-if="!form.options.length" class="admin-api-note">옵션은 선택 사항이며 빈 배열로 등록할 수 있습니다.</p>
      </section>
      <section class="admin-form-section">
        <div class="admin-form-section-heading"><div><strong>SKU</strong><span>판매 단위별 가격과 상태를 입력합니다.</span></div><button type="button" class="admin-reset-button" @click="addVariant">+ SKU</button></div>
        <div v-for="(variant, index) in form.variants" :key="variant.seq ?? `variant-${index}`" class="admin-full-form-grid">
          <label>SKU <em>필수</em><input v-model="variant.sku" required maxlength="80" /></label><label>색상<input v-model="variant.color" /></label><label>사이즈<input v-model="variant.size" /></label><label>공급가<input v-model.number="variant.supplyPrice" min="0" type="number" /></label><label>판매가<input v-model.number="variant.salePrice" min="0" type="number" /></label><label>상태<input v-model="variant.status" maxlength="30" /></label><button type="button" class="admin-reset-button" @click="form.variants.splice(index, 1)">삭제</button>
        </div>
        <p v-if="!form.variants.length" class="admin-api-note">SKU는 빈 배열로 등록할 수 있습니다. 판매 이력이 있는 SKU는 삭제 대신 상태 변경을 권장합니다.</p>
      </section>
      <p v-if="submitError" class="admin-form-error" role="alert">{{ submitError }}</p>
      <div class="admin-form-footer"><RouterLink to="/admin/supplier/products">취소</RouterLink><button class="admin-primary-button" type="submit" :disabled="saving">{{ saving ? '저장 중...' : isEditing ? '변경사항 저장' : '상품 등록' }}</button></div>
    </form>
  </main>
</template>
