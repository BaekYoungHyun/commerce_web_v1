<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCatalogProductsStore } from '../stores/catalogProducts'
import { useCategoriesStore } from '../stores/categories'
import CatalogProductCard from '../components/CatalogProductCard.vue'
import PageControls from '../components/PageControls.vue'
import { useSellerAdminStore } from '../stores/sellerAdmin'

const catalogStore = useCatalogProductsStore()
const categoriesStore = useCategoriesStore()
const sellerAdminStore = useSellerAdminStore()
const { products, pageData, loading, error } = storeToRefs(catalogStore)
const { options: categories } = storeToRefs(categoriesStore)
const categorySeq = ref<number | null>(null)
const keyword = ref('')
const activeProducts = computed(() =>
  products.value.filter((product) => product.status === 'ACTIVE'),
)
const wishlistProductSeqs = computed(
  () => new Set(sellerAdminStore.wishlists.map((item) => item.product_seq)),
)

async function load(page = 0, size = pageData.value.size) {
  await catalogStore
    .fetchProducts({
      page,
      size,
      categorySeq: categorySeq.value ?? undefined,
      name: keyword.value.trim() || undefined,
      status: 'ACTIVE',
    })
    .catch(() => undefined)
}

function reset() {
  categorySeq.value = null
  keyword.value = ''
  load(0)
}

onMounted(async () => {
  await categoriesStore.fetchCategories().catch(() => undefined)
  await sellerAdminStore.fetchWishlists().catch(() => undefined)
  await load(0)
})
</script>

<template>
  <main class="admin-content admin-list-content seller-catalog-admin">
    <div class="admin-page-heading">
      <div>
        <p>WHOLESALE SOURCING</p>
        <h1>상품 탐색</h1>
        <span>판매할 도매 상품과 공급 조건을 확인하고 장바구니에 담아보세요.</span>
      </div>
      <RouterLink class="admin-primary-button" to="/admin/seller/cart">장바구니 보기</RouterLink>
    </div>
    <form class="admin-filter-panel seller-catalog-filters" @submit.prevent="load(0)">
      <label
        ><span>카테고리</span
        ><select v-model="categorySeq">
          <option :value="null">전체 카테고리</option>
          <option v-for="category in categories" :key="category.seq" :value="category.seq">
            {{ category.label }}
          </option>
        </select></label
      >
      <label class="admin-search-field"
        ><span>상품명</span><input v-model="keyword" placeholder="상품명 검색"
      /></label>
      <button class="admin-reset-button" type="button" @click="reset">↻ 초기화</button>
      <button class="admin-search-button" type="submit">검색</button>
    </form>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load(pageData.page)">다시 시도</button>
    </p>
    <section class="admin-table-panel seller-catalog-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>판매 가능 상품</h2>
          <span>총 {{ pageData.totalElements }}개</span>
        </div>
      </div>
      <div v-if="loading" class="admin-common-state">상품을 불러오는 중입니다.</div>
      <div v-else-if="activeProducts.length" class="seller-admin-product-grid">
        <CatalogProductCard
          v-for="product in activeProducts"
          :key="product.seq"
          :product="product"
          detail-base-path="/admin/seller/products"
          :wishlisted="wishlistProductSeqs.has(product.seq)"
        />
      </div>
      <div v-else class="admin-common-state">조건에 맞는 판매 가능 상품이 없습니다.</div>
      <PageControls
        :page="pageData.page"
        :size="pageData.size"
        :total-pages="pageData.totalPages"
        :total-elements="pageData.totalElements"
        @change="load"
      />
    </section>
  </main>
</template>
