<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminProductsStore } from '../stores/adminProducts'
import { useCategoriesStore } from '../stores/categories'
import { productStatuses, productStatusLabel } from '../data/productStatuses'
import { formatDateTime } from '../utils/dateTime'
import PageControls from '../components/PageControls.vue'

const route = useRoute()
const router = useRouter()
const store = useAdminProductsStore()
const categoriesStore = useCategoriesStore()
const { pageData, products, loading, error } = storeToRefs(store)
const { options: categoryOptions, loading: categoriesLoading } = storeToRefs(categoriesStore)
const adminRole = computed(() => (route.meta.adminRole === 'seller' ? 'seller' : 'supplier'))
const isSupplier = computed(() => adminRole.value === 'supplier')
const name = ref('')
const status = ref('')
const categorySeq = ref<number | null>(null)
const wholesaleStoreSeq = ref<number | null>(null)
const selectedIds = ref<number[]>([])
const draftCount = computed(
  () => products.value.filter((product) => product.status === 'DRAFT').length,
)

async function load(page = 0, size = pageData.value.size) {
  try {
    await store.fetchProducts({
      page,
      size,
      name: name.value.trim() || undefined,
      status: status.value.trim() || undefined,
      categorySeq: categorySeq.value ?? undefined,
      wholesaleStoreSeq: wholesaleStoreSeq.value ?? undefined,
    })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) {
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
    }
  }
}

function resetFilters() {
  name.value = ''
  status.value = ''
  categorySeq.value = null
  wholesaleStoreSeq.value = null
  load(0)
}

async function initialize() {
  try {
    await categoriesStore.fetchCategories()
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) {
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
      return
    }
  }
  await load(0)
}

onMounted(initialize)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>{{ isSupplier ? 'WHOLESALE PRODUCT CENTER' : 'SELLER PRODUCT CENTER' }}</p>
        <h1>{{ isSupplier ? '도매 상품 관리' : '판매 상품 관리' }}</h1>
        <span>서버에 등록된 상품의 상태와 기본 거래 조건을 조회합니다.</span>
      </div>
      <RouterLink v-if="isSupplier" class="admin-primary-button" to="/admin/supplier/products/new"
        >+ 상품 등록</RouterLink
      >
      <RouterLink v-else class="admin-primary-button" to="/">+ 상품 소싱하기</RouterLink>
    </div>

    <section class="admin-summary" aria-label="상품 요약">
      <div>
        <span>전체 상품</span><strong>{{ pageData.totalElements }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>현재 페이지</span><strong>{{ products.length }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>등록 상품</span><strong>{{ draftCount }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>전체 페이지</span><strong>{{ pageData.totalPages }}</strong
        ><small>페이지</small>
      </div>
    </section>

    <form
      class="admin-filter-panel product-api-filters"
      aria-label="상품 검색 조건"
      @submit.prevent="load(0)"
    >
      <label
        ><span>도매상 SEQ</span
        ><input v-model.number="wholesaleStoreSeq" min="1" type="number" placeholder="전체"
      /></label>
      <label
        ><span>카테고리</span
        ><select v-model="categorySeq" :disabled="categoriesLoading">
          <option :value="null">전체 카테고리</option>
          <option v-for="category in categoryOptions" :key="category.seq" :value="category.seq">
            {{ category.label }}
          </option>
        </select></label
      >
      <label
        ><span>상품 상태</span
        ><select v-model="status">
          <option value="">전체 상태</option>
          <option v-for="item in productStatuses" :key="item.value" :value="item.value">
            {{ item.label }} ({{ item.value }})
          </option>
        </select></label
      >
      <label class="admin-search-field"
        ><span>상품명</span><input v-model="name" maxlength="200" placeholder="상품명 검색"
      /></label>
      <button class="admin-reset-button" type="button" @click="resetFilters">↻ 초기화</button>
      <button class="admin-search-button" type="submit">검색</button>
    </form>

    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load(pageData.page)">다시 시도</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>상품 목록</h2>
          <span>총 {{ pageData.totalElements }}개</span>
        </div>
        <div>
          <button type="button" disabled>선택 {{ selectedIds.length }}개</button>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table product-api-table">
          <thead>
            <tr>
              <th>선택</th>
              <th>상품 SEQ</th>
              <th>대표 이미지</th>
              <th>도매상</th>
              <th>카테고리</th>
              <th>상품명</th>
              <th>최소 주문</th>
              <th>상태</th>
              <th>등록일</th>
              <th>수정일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="admin-empty">상품 목록을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="product in products" v-else :key="product.seq">
              <td>
                <input
                  v-model="selectedIds"
                  type="checkbox"
                  :value="product.seq"
                  :aria-label="`${product.name} 선택`"
                />
              </td>
              <td>{{ product.seq }}</td>
              <td>
                <img
                  v-if="product.images[0]"
                  :src="product.images[0].imageUrl"
                  :alt="`${product.name} 대표 이미지`"
                /><span v-else class="admin-product-image-fallback" aria-label="대표 이미지 없음"
                  >NO IMAGE</span
                >
              </td>
              <td class="admin-product-wholesale">
                <strong>{{ product.wholesaleStoreName ?? '도매상명 없음' }}</strong
                ><small>SEQ {{ product.wholesaleStoreSeq }}</small>
              </td>
              <td>{{ categoriesStore.nameOf(product.categorySeq) }}</td>
              <td>
                <RouterLink
                  class="admin-product-name"
                  :to="
                    isSupplier
                      ? `/admin/supplier/products/${product.seq}`
                      : `/admin/seller/products/${product.seq}`
                  "
                  >{{ product.name }}</RouterLink
                >
              </td>
              <td>{{ product.minOrderQuantity }}개</td>
              <td>
                <i class="admin-status">{{ productStatusLabel(product.status) }}</i>
              </td>
              <td>{{ formatDateTime(product.createdAt) }}</td>
              <td>{{ formatDateTime(product.updatedAt) }}</td>
              <td>
                <div class="admin-row-actions">
                  <RouterLink v-if="isSupplier" :to="`/admin/supplier/products/${product.seq}/edit`"
                    >수정</RouterLink
                  ><RouterLink v-else :to="`/admin/seller/products/${product.seq}`"
                    >상세</RouterLink
                  >
                </div>
              </td>
            </tr>
            <tr v-if="!loading && products.length === 0">
              <td colspan="11" class="admin-empty">조건에 맞는 상품이 없습니다.</td>
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
