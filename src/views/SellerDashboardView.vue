<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSellerAdminStore } from '../stores/sellerAdmin'
const store = useSellerAdminStore()
const { dashboard, loading, error } = storeToRefs(store)
const money = (value: number) => value.toLocaleString('ko-KR')
onMounted(() => store.fetchDashboard().catch(() => undefined))
</script>
<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>SELLER DASHBOARD</p>
        <h1>대시보드</h1>
        <span>셀러 매장과 구매 업무 현황을 확인합니다.</span>
      </div>
    </div>
    <p v-if="error" class="admin-list-error">{{ error }}</p>
    <div v-if="loading" class="admin-common-state">현황을 불러오는 중입니다.</div>
    <section v-else-if="dashboard" class="seller-dashboard-grid">
      <article>
        <span>연결 매장</span><strong>{{ dashboard.store_count }}</strong
        ><small>개</small>
      </article>
      <article>
        <span>전체 주문</span><strong>{{ dashboard.order_count }}</strong
        ><small>건</small>
      </article>
      <article>
        <span>전체 주문 금액</span><strong>{{ money(dashboard.total_order_amount) }}</strong
        ><small>원</small>
      </article>
      <article>
        <span>찜 상품</span><strong>{{ dashboard.wishlist_count }}</strong
        ><small>개</small>
      </article>
      <article>
        <span>미확인 알림</span><strong>{{ dashboard.unread_notification_count }}</strong
        ><small>건</small>
      </article>
    </section>
  </main>
</template>
