<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { wholesaleManagementApi } from '../services/wholesaleManagementApi'
import type { WholesaleManagementDashboard } from '../types/wholesaleManagement'

const authStore = useAuthStore()
const dashboard = ref<WholesaleManagementDashboard | null>(null)
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    dashboard.value = await wholesaleManagementApi.dashboard(await authStore.getValidAccessToken())
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '대시보드를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>WHOLESALE DASHBOARD</p>
        <h1>대시보드</h1>
        <span>소유 도매 매장의 핵심 운영 현황을 확인합니다.</span>
      </div>
    </div>
    <p v-if="error" class="admin-list-error">
      {{ error }} <button @click="load">다시 시도</button>
    </p>
    <div v-if="loading" class="admin-common-state">현황을 불러오는 중입니다.</div>
    <section v-else-if="dashboard" class="seller-dashboard-grid">
      <article>
        <span>도매 매장</span><strong>{{ dashboard.store_count }}</strong
        ><small>개</small>
      </article>
      <article>
        <span>등록 상품</span><strong>{{ dashboard.product_count }}</strong
        ><small>개</small>
      </article>
      <article>
        <span>주문 상품</span><strong>{{ dashboard.order_item_count }}</strong
        ><small>건</small>
      </article>
      <article>
        <span>재고 부족</span><strong>{{ dashboard.low_stock_count }}</strong
        ><small>건</small>
      </article>
      <article>
        <span>요청 클레임</span><strong>{{ dashboard.requested_claim_count }}</strong
        ><small>건</small>
      </article>
    </section>
    <p class="admin-dashboard-guide">
      재고 부족은 가이드 계약에 따라 가용 재고 5개 이하를 집계합니다.
    </p>
  </main>
</template>
