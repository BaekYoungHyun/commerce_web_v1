<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCategoriesStore } from '../stores/categories'
import { useCatalogProductsStore } from '../stores/catalogProducts'
import CatalogProductCard from '../components/CatalogProductCard.vue'
import PageControls from '../components/PageControls.vue'
import { useSellerAdminStore } from '../stores/sellerAdmin'
import type { ApiCategory } from '../types/category'

const route = useRoute()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const catalogStore = useCatalogProductsStore()
const sellerAdminStore = useSellerAdminStore()
const { products, pageData, loading, error } = storeToRefs(catalogStore)
const keyword = ref('')
const sort = ref('newest')
const categoryName = computed(() => String(route.params.category))
const categorySeq = computed(() => {
  const querySeq = Number(route.query.categorySeq)
  if (Number.isInteger(querySeq) && querySeq > 0) return querySeq
  return (
    categoriesStore.options.find((category) => category.name === categoryName.value)?.seq ?? null
  )
})
const categoryLabel = computed(() =>
  categorySeq.value ? categoriesStore.nameOf(categorySeq.value) : categoryName.value,
)
function containsCategory(category: ApiCategory, seq: number): boolean {
  return category.seq === seq || category.children.some((child) => containsCategory(child, seq))
}
const selectedRootCategory = computed(() => {
  if (!categorySeq.value) return null
  return (
    categoriesStore.categories.find((category) => containsCategory(category, categorySeq.value!)) ??
    null
  )
})
const secondDepthCategories = computed(() => selectedRootCategory.value?.children ?? [])
const sortedProducts = computed(() => {
  if (sort.value === 'lowPrice')
    return [...products.value].sort(
      (a, b) => (a.variants[0]?.supplyPrice ?? 0) - (b.variants[0]?.supplyPrice ?? 0),
    )
  if (sort.value === 'highMargin')
    return [...products.value].sort((a, b) => {
      const av = a.variants[0]
      const bv = b.variants[0]
      const am = av?.salePrice ? (av.salePrice - av.supplyPrice) / av.salePrice : 0
      const bm = bv?.salePrice ? (bv.salePrice - bv.supplyPrice) / bv.salePrice : 0
      return bm - am
    })
  return products.value
})
const wishlistProductSeqs = computed(
  () => new Set(sellerAdminStore.wishlists.map((item) => item.product_seq)),
)

async function load(page = 0, size = pageData.value.size) {
  if (!authStore.accessToken || !categorySeq.value) return
  await catalogStore
    .fetchProducts({
      page,
      size,
      categorySeq: categorySeq.value,
      name: keyword.value.trim() || undefined,
    })
    .catch(() => undefined)
}

watch(
  [() => authStore.accessToken, categoryName, () => route.query.categorySeq],
  async ([token]) => {
    if (!token) return
    await categoriesStore.fetchCategories().catch(() => undefined)
    if (authStore.isRetail) await sellerAdminStore.fetchWishlists().catch(() => undefined)
    await load(0)
  },
  { immediate: true },
)
</script>

<template>
  <main class="category-products-page catalog-full-page">
    <nav class="breadcrumbs">
      <RouterLink to="/">홈</RouterLink><span>›</span><strong>{{ categoryLabel }}</strong>
    </nav>
    <header class="catalog-list-heading">
      <div>
        <p>WHOLESALE CATEGORY</p>
        <h1>{{ categoryName }}</h1>
        <span>사업자 셀러를 위해 엄선한 {{ categoryLabel }} 상품입니다.</span>
      </div>
      <strong>{{ pageData.totalElements.toLocaleString() }}<small> PRODUCTS</small></strong>
    </header>
    <nav
      v-if="secondDepthCategories.length"
      class="category-mini-nav api-category-mini"
      :aria-label="`${selectedRootCategory?.name} 2뎁스 카테고리`"
    >
      <RouterLink
        v-for="item in secondDepthCategories"
        :key="item.seq"
        :to="{
          path: `/categories/${encodeURIComponent(item.name)}`,
          query: { categorySeq: item.seq },
        }"
        :class="{ active: item.seq === categorySeq }"
        >{{ item.name }}</RouterLink
      >
    </nav>
    <section class="catalog-list-toolbar">
      <div>
        <strong>{{ categoryLabel }}</strong
        ><span>총 {{ pageData.totalElements.toLocaleString() }}개</span>
      </div>
      <div>
        <label class="inline-search"
          ><span>⌕</span
          ><input v-model="keyword" placeholder="상품명 검색" @keyup.enter="load(0)" /></label
        ><select v-model="sort" aria-label="정렬">
          <option value="newest">최신 등록순</option>
          <option value="lowPrice">낮은 공급가순</option>
          <option value="highMargin">높은 예상 마진순</option>
        </select>
      </div>
    </section>
    <section v-if="!authStore.accessToken" class="catalog-api-state">
      <strong>사업자 로그인 후 상품을 확인할 수 있습니다.</strong
      ><RouterLink :to="{ path: '/login', query: { redirect: route.fullPath } }"
        >로그인하기 →</RouterLink
      >
    </section>
    <section v-else-if="loading" class="catalog-api-state">
      <strong>상품을 불러오는 중입니다.</strong>
    </section>
    <section v-else-if="error" class="catalog-api-state">
      <strong>{{ error }}</strong
      ><button type="button" @click="load(pageData.page)">다시 시도</button>
    </section>
    <section v-else-if="sortedProducts.length" class="catalog-api-grid catalog-list-grid">
      <CatalogProductCard
        v-for="(product, index) in sortedProducts"
        :key="product.seq"
        :product="product"
        :rank="pageData.page * pageData.size + index + 1"
        :wishlisted="wishlistProductSeqs.has(product.seq)"
      />
    </section>
    <section v-else class="catalog-api-state">
      <strong>등록된 상품이 없습니다.</strong>
      <p>새로운 도매 상품을 준비하고 있습니다.</p>
    </section>
    <PageControls
      :page="pageData.page"
      :size="pageData.size"
      :total-pages="pageData.totalPages"
      :total-elements="pageData.totalElements"
      @change="load"
    />
  </main>
</template>
