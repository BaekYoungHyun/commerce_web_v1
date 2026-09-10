<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCatalogProductsStore } from '../stores/catalogProducts'
import { useCategoriesStore } from '../stores/categories'
import PageControls from '../components/PageControls.vue'
import { useSellerAdminStore } from '../stores/sellerAdmin'
import { productStatusLabel } from '../data/productStatuses'
import { formatDateTime } from '../utils/dateTime'

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
const currentPageStockQuantity = computed(() =>
  activeProducts.value.reduce((total, product) => total + product.totalStockQuantity, 0),
)
const formatPrice = (value: number) => value.toLocaleString('ko-KR')

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
    <section class="admin-summary" aria-label="상품 탐색 요약">
      <div>
        <span>전체 판매 상품</span><strong>{{ pageData.totalElements }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>현재 페이지</span><strong>{{ activeProducts.length }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>현재 가용 재고</span><strong>{{ currentPageStockQuantity }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>전체 페이지</span><strong>{{ pageData.totalPages }}</strong
        ><small>페이지</small>
      </div>
    </section>
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
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table seller-product-table">
          <thead>
            <tr>
              <th>상품 SEQ</th>
              <th>대표 이미지</th>
              <th>도매처</th>
              <th>카테고리</th>
              <th>상품명</th>
              <th>공급가</th>
              <th>권장 판매가</th>
              <th>최소 주문</th>
              <th>가용 재고</th>
              <th>상태</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="12" class="admin-empty">상품을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="product in activeProducts" v-else :key="product.seq">
              <td>{{ product.seq }}</td>
              <td>
                <img
                  v-if="product.images[0]"
                  :src="product.images[0].imageUrl"
                  :alt="`${product.name} 대표 이미지`"
                /><span v-else class="admin-product-image-fallback">NO IMAGE</span>
              </td>
              <td>
                <strong>{{ product.wholesaleStoreName ?? '도매처 정보 없음' }}</strong
                ><small>SEQ {{ product.wholesaleStoreSeq }}</small>
              </td>
              <td>{{ categoriesStore.nameOf(product.categorySeq) }}</td>
              <td>
                <RouterLink
                  class="admin-product-name"
                  :to="`/admin/seller/products/${product.seq}`"
                  >{{ product.name }}</RouterLink
                ><small>SKU {{ product.variants.length }}개</small>
              </td>
              <td>{{ formatPrice(product.variants[0]?.supplyPrice ?? 0) }}원</td>
              <td>{{ formatPrice(product.variants[0]?.salePrice ?? 0) }}원</td>
              <td>{{ product.minOrderQuantity }}개</td>
              <td>{{ product.totalStockQuantity.toLocaleString() }}개</td>
              <td>
                <i class="admin-status">{{ productStatusLabel(product.status) }}</i>
              </td>
              <td>{{ formatDateTime(product.createdAt) }}</td>
              <td>
                <div class="admin-row-actions">
                  <RouterLink :to="`/admin/seller/products/${product.seq}`">상세</RouterLink
                  ><span
                    :title="wishlistProductSeqs.has(product.seq) ? '찜한 상품' : '찜하지 않은 상품'"
                    >{{ wishlistProductSeqs.has(product.seq) ? '♥' : '♡' }}</span
                  >
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !activeProducts.length">
              <td colspan="12" class="admin-empty">조건에 맞는 판매 가능 상품이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
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

<style scoped>
.seller-product-table {
  min-width: 1320px;
}
.seller-product-table img,
.seller-product-table .admin-product-image-fallback {
  width: 54px;
  height: 68px;
  object-fit: cover;
}
.seller-product-table small {
  display: block;
  margin-top: 4px;
  color: #8a8d92;
  font-size: 10px;
}
</style>
