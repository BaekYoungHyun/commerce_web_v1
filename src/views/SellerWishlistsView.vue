<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSellerAdminStore } from '../stores/sellerAdmin'
import { formatDateTime } from '../utils/dateTime'
const store = useSellerAdminStore()
const { wishlists, loading, error } = storeToRefs(store)
const money = (v: number) => v.toLocaleString('ko-KR')
onMounted(() => store.fetchWishlists().catch(() => undefined))
</script>
<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>WISHLIST</p>
        <h1>찜 상품</h1>
        <span>소매 매장별로 저장한 도매 상품을 관리합니다.</span>
      </div>
      <RouterLink class="admin-primary-button" to="/admin/seller/products">상품 탐색</RouterLink>
    </div>
    <p v-if="error" class="admin-list-error">{{ error }}</p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>찜 목록</h2>
          <span>{{ wishlists.length }}개</span>
        </div>
      </div>
      <div v-if="loading" class="admin-common-state">불러오는 중입니다.</div>
      <div v-else class="admin-common-list">
        <article v-for="item in wishlists" :key="item.seq">
          <header>
            <div>
              <span>{{ item.wholesale_store_name }}</span>
              <h3>
                <RouterLink :to="`/admin/seller/products/${item.product_seq}`">{{
                  item.product_name
                }}</RouterLink>
              </h3>
            </div>
            <i class="admin-status">{{ item.product_status }}</i>
          </header>
          <p>
            {{ item.retail_store_name }} ·
            {{ item.price == null ? '판매 SKU 없음' : `${money(item.price)}원` }} ·
            {{ formatDateTime(item.created_at) }}
          </p>
          <div class="admin-row-actions">
            <button @click="store.removeWishlist(item.seq).catch(() => undefined)">찜 삭제</button>
          </div>
        </article>
        <div v-if="!wishlists.length" class="admin-common-state">찜한 상품이 없습니다.</div>
      </div>
    </section>
  </main>
</template>
