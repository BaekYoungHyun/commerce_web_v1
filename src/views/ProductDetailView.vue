<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { productStatusLabel } from '../data/productStatuses'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useCatalogProductsStore } from '../stores/catalogProducts'
import { useCategoriesStore } from '../stores/categories'
import { useSellerAdminStore } from '../stores/sellerAdmin'

const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()
const catalogStore = useCatalogProductsStore()
const categoriesStore = useCategoriesStore()
const sellerAdminStore = useSellerAdminStore()
const {
  currentProduct: product,
  detailLoading: loading,
  detailError: error,
} = storeToRefs(catalogStore)
const selectedImageSeq = ref<number | null>(null)
const selectedVariantSeq = ref<number | null>(null)
const variantQuantities = ref<Record<number, number>>({})
const showToast = ref(false)
const toastMessage = ref('')
const isSellerAdmin = computed(() => route.meta.sellerCatalog === true)
const catalogPath = computed(() => (isSellerAdmin.value ? '/admin/seller/products' : '/'))

const productSeq = computed(() => Number(route.params.id))
const currentWishlist = computed(
  () => sellerAdminStore.wishlists.find((item) => item.product_seq === productSeq.value) ?? null,
)
const canUseWishlist = computed(() => authStore.isRetail)
const sortedImages = computed(() =>
  [...(product.value?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
)
const selectedImage = computed(
  () =>
    sortedImages.value.find((image) => image.seq === selectedImageSeq.value) ??
    sortedImages.value[0],
)
const selectedVariant = computed(
  () => product.value?.variants.find((variant) => variant.seq === selectedVariantSeq.value) ?? null,
)
const selectedVariants = computed(() =>
  (product.value?.variants ?? [])
    .map((variant) => ({ variant, quantity: variantQuantities.value[variant.seq] ?? 0 }))
    .filter((item) => item.quantity > 0),
)
const totalQuantity = computed(() =>
  selectedVariants.value.reduce((total, item) => total + item.quantity, 0),
)
const canOrder = computed(
  () =>
    product.value?.status === 'ACTIVE' &&
    selectedVariants.value.length > 0 &&
    totalQuantity.value >= (product.value?.minOrderQuantity ?? 1),
)
const totalPrice = computed(() =>
  selectedVariants.value.reduce(
    (total, item) => total + item.variant.supplyPrice * item.quantity,
    0,
  ),
)
const marginRate = computed(() => {
  const variant = selectedVariant.value
  if (!variant || variant.salePrice <= 0) return 0
  return Math.round(((variant.salePrice - variant.supplyPrice) / variant.salePrice) * 100)
})
const categoryName = computed(() =>
  product.value ? categoriesStore.nameOf(product.value.categorySeq) : '',
)

const formatPrice = (value: number) => new Intl.NumberFormat('ko-KR').format(value)
const variantName = (variant: NonNullable<typeof product.value>['variants'][number]) =>
  [variant.color, variant.size].filter(Boolean).join(' / ') || variant.sku

async function loadProduct() {
  if (!authStore.accessToken || !Number.isInteger(productSeq.value) || productSeq.value <= 0) return
  try {
    await Promise.all([
      catalogStore.fetchProduct(productSeq.value),
      categoriesStore.fetchCategories(),
      authStore.isRetail ? sellerAdminStore.fetchWishlists() : Promise.resolve(),
    ])
    selectedImageSeq.value = sortedImages.value[0]?.seq ?? null
    selectedVariantSeq.value = null
    variantQuantities.value = {}
  } catch {
    // 스토어의 상세 오류 상태를 화면에 표시한다.
  }
}

watch(productSeq, loadProduct, { immediate: true })

function selectVariant(variantSeq: number) {
  selectedVariantSeq.value = variantSeq
  variantQuantities.value = {
    ...variantQuantities.value,
    [variantSeq]: (variantQuantities.value[variantSeq] ?? 0) + 1,
  }
}

function changeVariantQuantity(variantSeq: number, amount: number) {
  const nextQuantity = Math.max(0, (variantQuantities.value[variantSeq] ?? 0) + amount)
  const nextQuantities = { ...variantQuantities.value }
  if (nextQuantity === 0) {
    delete nextQuantities[variantSeq]
    if (selectedVariantSeq.value === variantSeq) {
      selectedVariantSeq.value =
        selectedVariants.value.find((item) => item.variant.seq !== variantSeq)?.variant.seq ?? null
    }
  } else {
    nextQuantities[variantSeq] = nextQuantity
    selectedVariantSeq.value = variantSeq
  }
  variantQuantities.value = nextQuantities
}

async function addToCart() {
  if (!product.value || !canOrder.value) return
  try {
    for (const item of selectedVariants.value) {
      await cartStore.addItem({
        productSeq: product.value.seq,
        variantSeq: item.variant.seq,
        quantity: item.quantity,
      })
    }
    toastMessage.value = `${product.value.name} ${totalQuantity.value}개를 장바구니에 담았습니다.`
  } catch {
    toastMessage.value = cartStore.error
  }
  showToast.value = true
  window.setTimeout(() => (showToast.value = false), 2200)
}
async function addToWishlist() {
  if (!product.value || !canUseWishlist.value) return
  try {
    if (currentWishlist.value) {
      await sellerAdminStore.removeWishlist(currentWishlist.value.seq)
      toastMessage.value = '찜 상품에서 해제했습니다.'
      showToast.value = true
      window.setTimeout(() => (showToast.value = false), 2200)
      return
    }
    await cartStore.loadCart()
    const retailStoreSeq = cartStore.cart?.buyer.retailStoreSeq
    if (retailStoreSeq == null) throw new Error('연결된 소매 매장이 필요합니다.')
    await sellerAdminStore.addWishlist({ retailStoreSeq, productSeq: product.value.seq })
    toastMessage.value = '찜 상품에 추가했습니다.'
  } catch (cause) {
    toastMessage.value = cause instanceof Error ? cause.message : '찜 상품 추가에 실패했습니다.'
  }
  showToast.value = true
  window.setTimeout(() => (showToast.value = false), 2200)
}
</script>

<template>
  <main v-if="!authStore.accessToken" class="detail-page catalog-api-state">
    <strong>사업자 로그인 후 상품 상세를 확인할 수 있습니다.</strong>
    <RouterLink :to="{ path: '/login', query: { redirect: route.fullPath } }"
      >로그인하기 →</RouterLink
    >
  </main>

  <main v-else-if="loading" class="detail-page catalog-api-state">
    <strong>상품 상세 정보를 불러오는 중입니다.</strong>
  </main>

  <main v-else-if="error || !product" class="detail-page catalog-api-state">
    <strong>{{ error || '상품을 찾을 수 없습니다.' }}</strong>
    <button type="button" @click="loadProduct">다시 시도</button>
    <RouterLink :to="catalogPath">상품 목록으로 돌아가기</RouterLink>
  </main>

  <main
    v-else
    :class="
      isSellerAdmin
        ? 'admin-content api-catalog-detail seller-admin-product-detail'
        : 'detail-page api-catalog-detail'
    "
  >
    <nav class="breadcrumbs" aria-label="현재 위치">
      <RouterLink :to="catalogPath">도매 상품</RouterLink><span>›</span
      ><span>{{ categoryName }}</span
      ><span>›</span><strong>{{ product.name }}</strong>
    </nav>

    <section class="detail-layout">
      <div class="detail-gallery">
        <div
          v-if="sortedImages.length"
          class="detail-thumbnails"
          aria-label="상품 상세 이미지 선택"
        >
          <button
            v-for="(image, index) in sortedImages"
            :key="image.seq"
            type="button"
            :class="{ active: selectedImage?.seq === image.seq }"
            :aria-label="`${product.name} 이미지 ${index + 1} 보기`"
            :aria-pressed="selectedImage?.seq === image.seq"
            @click="selectedImageSeq = image.seq"
          >
            <img :src="image.imageUrl" :alt="`${product.name} 이미지 ${index + 1}`" />
          </button>
        </div>
        <div class="detail-image">
          <Transition v-if="selectedImage" name="gallery-fade" mode="out-in">
            <img
              :key="selectedImage.seq"
              :src="selectedImage.imageUrl"
              :alt="`${product.name} 선택 이미지`"
            />
          </Transition>
          <div v-else class="detail-image-empty">등록된 상품 이미지가 없습니다.</div>
          <span class="badge">{{ productStatusLabel(product.status) }}</span>
          <span v-if="selectedImage" class="image-counter"
            >{{ sortedImages.findIndex((image) => image.seq === selectedImage?.seq) + 1 }} /
            {{ sortedImages.length }}</span
          >
        </div>
      </div>

      <div class="detail-info">
        <div class="supplier-row">
          <div>
            <span>도매상</span><b>{{ product.wholesaleStoreName ?? '도매상명 없음' }}</b>
          </div>
          <strong>✓ B2B 전용 상품</strong>
        </div>
        <h1>{{ product.name }}</h1>
        <p class="detail-description">
          {{ product.description || '등록된 상품 설명이 없습니다.' }}
        </p>

        <div class="detail-pricing">
          <div>
            <span>도매 공급가</span
            ><strong>{{ formatPrice(selectedVariant?.supplyPrice ?? 0) }}원</strong
            ><small>선택 SKU 기준</small>
          </div>
          <div>
            <span>판매가</span><b>{{ formatPrice(selectedVariant?.salePrice ?? 0) }}원</b>
          </div>
          <div class="margin-highlight">
            <span>예상 마진율</span><b>{{ marginRate }}%</b>
          </div>
        </div>

        <dl class="trade-conditions">
          <div>
            <dt>카테고리</dt>
            <dd>{{ categoryName }}</dd>
          </div>
          <div>
            <dt>최소 주문</dt>
            <dd>{{ product.minOrderQuantity.toLocaleString() }}개부터</dd>
          </div>
          <div>
            <dt>상품 상태</dt>
            <dd>{{ productStatusLabel(product.status) }}</dd>
          </div>
          <div>
            <dt>조회수</dt>
            <dd>{{ product.viewCount.toLocaleString() }}회</dd>
          </div>
        </dl>

        <div v-if="product.options.length" class="api-option-summary">
          <span>상품 옵션</span>
          <div>
            <i v-for="option in product.options" :key="option.seq"
              >{{ option.optionName }} · {{ option.optionValue }}</i
            >
          </div>
        </div>

        <div class="option-block">
          <span>SKU 선택</span>
          <div v-if="product.variants.length" class="option-buttons">
            <button
              v-for="variant in product.variants"
              :key="variant.seq"
              type="button"
              :class="{ active: (variantQuantities[variant.seq] ?? 0) > 0 }"
              :disabled="variant.status !== 'ACTIVE'"
              :aria-label="`${variantName(variant)} 1개 추가`"
              @click="selectVariant(variant.seq)"
            >
              {{ variantName(variant) }} · {{ formatPrice(variant.supplyPrice) }}원
              <b v-if="variantQuantities[variant.seq]">×{{ variantQuantities[variant.seq] }}</b>
              <small v-if="variant.status !== 'ACTIVE'">{{
                productStatusLabel(variant.status)
              }}</small>
            </button>
          </div>
          <p v-else class="detail-empty-copy">등록된 SKU가 없습니다.</p>
        </div>

        <div class="selected-sku-list">
          <div v-for="item in selectedVariants" :key="item.variant.seq">
            <span
              ><strong>{{ variantName(item.variant) }}</strong
              ><small>{{ item.variant.sku }}</small></span
            >
            <div class="quantity-control">
              <button
                type="button"
                :aria-label="`${variantName(item.variant)} 수량 줄이기`"
                @click="changeVariantQuantity(item.variant.seq, -1)"
              >
                −
              </button>
              <strong>{{ item.quantity }}</strong>
              <button
                type="button"
                :aria-label="`${variantName(item.variant)} 수량 늘리기`"
                @click="changeVariantQuantity(item.variant.seq, 1)"
              >
                ＋
              </button>
            </div>
            <b>{{ formatPrice(item.variant.supplyPrice * item.quantity) }}원</b>
          </div>
          <p v-if="!selectedVariants.length">SKU를 클릭하면 수량이 1개씩 추가됩니다.</p>
        </div>

        <div class="order-box">
          <div class="order-quantity">
            <span>총 선택 수량</span><strong>{{ totalQuantity.toLocaleString() }}개</strong>
          </div>
          <div class="order-total">
            <span>총 상품 금액</span><strong>{{ formatPrice(totalPrice) }}원</strong>
          </div>
        </div>

        <div class="detail-actions">
          <button
            class="wish-button"
            type="button"
            aria-label="찜하기"
            :class="{ active: currentWishlist }"
            :disabled="!canUseWishlist"
            @click="addToWishlist"
          >
            {{ currentWishlist ? '♥' : '♡' }}
          </button>
          <button
            class="cart-button"
            type="button"
            :disabled="!canOrder || cartStore.loading"
            @click="addToCart"
          >
            {{ canOrder ? '장바구니 담기' : `최소 ${product.minOrderQuantity}개 선택` }}
          </button>
          <button class="buy-button" type="button" disabled>바로 주문</button>
        </div>
        <p class="business-notice">사업자 전용 상품이며 선택한 SKU의 공급가로 주문합니다.</p>
      </div>
    </section>

    <section class="product-detail-content">
      <header>
        <p class="eyebrow coral">PRODUCT DETAIL</p>
        <h2>상품 상세 이미지</h2>
        <p>{{ product.name }}의 등록 이미지를 자세히 확인해보세요.</p>
      </header>
      <div v-if="sortedImages.length" class="detail-image-stack">
        <figure v-for="(image, index) in sortedImages" :key="`detail-${image.seq}`">
          <img
            :src="image.imageUrl"
            :alt="`${product.name} 상품 상세 이미지 ${index + 1}`"
            loading="lazy"
          />
          <figcaption>
            {{ String(index + 1).padStart(2, '0') }} /
            {{ String(sortedImages.length).padStart(2, '0') }}
          </figcaption>
        </figure>
      </div>
      <p v-else class="detail-empty-copy">등록된 상세 이미지가 없습니다.</p>
    </section>

    <section class="detail-guide">
      <h2>거래 전 확인사항</h2>
      <div>
        <article>
          <span>01</span><strong>사업자 전용 상품</strong>
          <p>사업자 인증 회원만 구매할 수 있습니다.</p>
        </article>
        <article>
          <span>02</span><strong>최소 주문 수량</strong>
          <p>최소 {{ product.minOrderQuantity.toLocaleString() }}개 이상 주문해 주세요.</p>
        </article>
        <article>
          <span>03</span><strong>SKU 상태 확인</strong>
          <p>판매 중인 SKU만 장바구니에 담을 수 있습니다.</p>
        </article>
      </div>
    </section>
  </main>

  <Transition name="toast"
    ><div v-if="showToast" class="toast">✓ {{ toastMessage }}</div></Transition
  >
</template>
