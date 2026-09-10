<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSellerAdminStore } from '../stores/sellerAdmin'
import { formatDateTime } from '../utils/dateTime'

const store = useSellerAdminStore()
const { wishlists, loading, error } = storeToRefs(store)
const keyword = ref('')
const retailStoreSeq = ref<number | null>(null)
const money = (value: number) => value.toLocaleString('ko-KR')
const storeOptions = computed(() => {
  const stores = new Map<number, string>()
  wishlists.value.forEach((item) => stores.set(item.retail_store_seq, item.retail_store_name))
  return [...stores.entries()].map(([seq, name]) => ({ seq, name }))
})
const filteredWishlists = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()
  return wishlists.value.filter(
    (item) =>
      (retailStoreSeq.value == null || item.retail_store_seq === retailStoreSeq.value) &&
      (!normalizedKeyword ||
        item.product_name.toLowerCase().includes(normalizedKeyword) ||
        item.wholesale_store_name.toLowerCase().includes(normalizedKeyword)),
  )
})
const activeCount = computed(
  () => wishlists.value.filter((item) => item.product_status === 'ACTIVE').length,
)

function resetFilters() {
  keyword.value = ''
  retailStoreSeq.value = null
}

onMounted(() => store.fetchWishlists().catch(() => undefined))
</script>

<template>
  <main class="admin-content admin-list-content seller-wishlist-admin">
    <div class="admin-page-heading">
      <div>
        <p>WISHLIST</p>
        <h1>찜 상품</h1>
        <span>소매 매장별로 저장한 도매 상품을 확인하고 관리합니다.</span>
      </div>
      <RouterLink class="admin-primary-button" to="/admin/seller/products">+ 상품 탐색</RouterLink>
    </div>

    <section class="admin-summary" aria-label="찜 상품 요약">
      <div>
        <span>전체 찜 상품</span><strong>{{ wishlists.length }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>검색 결과</span><strong>{{ filteredWishlists.length }}</strong
        ><small>개</small>
      </div>
      <div>
        <span>저장 매장</span><strong>{{ storeOptions.length }}</strong
        ><small>곳</small>
      </div>
      <div>
        <span>판매 중</span><strong>{{ activeCount }}</strong
        ><small>개</small>
      </div>
    </section>

    <form class="admin-filter-panel seller-catalog-filters" @submit.prevent>
      <label
        ><span>찜 저장 매장</span
        ><select v-model="retailStoreSeq">
          <option :value="null">전체 매장</option>
          <option v-for="item in storeOptions" :key="item.seq" :value="item.seq">
            {{ item.name }}
          </option>
        </select></label
      >
      <label class="admin-search-field"
        ><span>상품명·도매처</span><input v-model="keyword" placeholder="상품명 또는 도매처 검색"
      /></label>
      <button class="admin-reset-button" type="button" @click="resetFilters">↻ 초기화</button>
      <button class="admin-search-button" type="submit">검색</button>
    </form>

    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="store.fetchWishlists()">다시 시도</button>
    </p>
    <section class="admin-table-panel seller-catalog-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>찜 목록</h2>
          <span>총 {{ filteredWishlists.length }}개</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table seller-wishlist-table">
          <thead>
            <tr>
              <th>찜 SEQ</th>
              <th>대표 이미지</th>
              <th>저장 매장</th>
              <th>도매처</th>
              <th>상품명</th>
              <th>공급가</th>
              <th>가용 재고</th>
              <th>상태</th>
              <th>찜 등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" class="admin-empty">찜 상품을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="item in filteredWishlists" v-else :key="item.seq">
              <td>{{ item.seq }}</td>
              <td>
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="`${item.product_name} 대표 이미지`"
                /><span v-else class="admin-product-image-fallback">NO IMAGE</span>
              </td>
              <td>
                <strong>{{ item.retail_store_name }}</strong
                ><small>SEQ {{ item.retail_store_seq }}</small>
              </td>
              <td>
                <strong>{{ item.wholesale_store_name }}</strong
                ><small>SEQ {{ item.wholesale_store_seq }}</small>
              </td>
              <td>
                <RouterLink
                  class="admin-product-name"
                  :to="`/admin/seller/products/${item.product_seq}`"
                  >{{ item.product_name }}</RouterLink
                ><small>상품 SEQ {{ item.product_seq }}</small>
              </td>
              <td>{{ item.price == null ? '판매 SKU 없음' : `${money(item.price)}원` }}</td>
              <td>{{ item.total_stock_quantity.toLocaleString() }}개</td>
              <td>
                <i class="admin-status">{{ item.product_status }}</i>
              </td>
              <td>{{ formatDateTime(item.created_at) }}</td>
              <td>
                <div class="admin-row-actions">
                  <RouterLink :to="`/admin/seller/products/${item.product_seq}`">상세</RouterLink
                  ><button
                    type="button"
                    @click="store.removeWishlist(item.seq).catch(() => undefined)"
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !filteredWishlists.length">
              <td colspan="10" class="admin-empty">조건에 맞는 찜 상품이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.seller-wishlist-table {
  min-width: 1160px;
}
.seller-wishlist-table img,
.seller-wishlist-table .admin-product-image-fallback {
  width: 54px;
  height: 68px;
  object-fit: cover;
}
.seller-wishlist-table small {
  display: block;
  margin-top: 4px;
  color: #8a8d92;
  font-size: 10px;
}
</style>
