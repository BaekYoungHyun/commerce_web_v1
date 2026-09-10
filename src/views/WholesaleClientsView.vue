<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ApiError } from '../services/httpClient'
import { wholesaleManagementApi } from '../services/wholesaleManagementApi'
import { useAuthStore } from '../stores/auth'
import type { WholesaleClient } from '../types/wholesaleManagement'
import { formatDateTime } from '../utils/dateTime'
const auth = useAuthStore()
const clients = ref<WholesaleClient[]>([])
const loading = ref(false)
const error = ref('')
const money = (value: number) => value.toLocaleString('ko-KR')
async function authorized<T>(request: (token: string) => Promise<T>) {
  try {
    return await request(await auth.getValidAccessToken())
  } catch (cause) {
    if (!(cause instanceof ApiError) || cause.status !== 401) throw cause
    return request(await auth.refreshAccessToken())
  }
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    clients.value = await authorized(wholesaleManagementApi.clients)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '거래처를 불러오지 못했습니다.'
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
        <p>CLIENTS</p>
        <h1>거래처 관리</h1>
        <span>주문 이력이 있는 소매 매장별 거래 현황입니다.</span>
      </div>
    </div>
    <p v-if="error" class="admin-list-error">
      {{ error }} <button @click="load">다시 조회</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>거래처 목록</h2>
          <span>{{ clients.length }}곳</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table">
          <thead>
            <tr>
              <th>소매 매장</th>
              <th>사업자</th>
              <th>주문 수</th>
              <th>누적 거래액</th>
              <th>최근 주문</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="admin-empty">거래처를 불러오는 중입니다.</td>
            </tr>
            <tr v-for="client in clients" v-else :key="client.retail_store_seq">
              <td>
                <strong>{{ client.store_name }}</strong
                ><small>#{{ client.retail_store_seq }}</small>
              </td>
              <td>{{ client.company_name }}</td>
              <td>{{ client.order_count }}건</td>
              <td>{{ money(client.total_amount) }}원</td>
              <td>{{ formatDateTime(client.last_order_at) }}</td>
            </tr>
            <tr v-if="!loading && !clients.length">
              <td colspan="5" class="admin-empty">주문 이력이 있는 거래처가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
