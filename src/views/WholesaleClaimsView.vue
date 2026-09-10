<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ApiError } from '../services/httpClient'
import { wholesaleManagementApi } from '../services/wholesaleManagementApi'
import { useAuthStore } from '../stores/auth'
import type {
  WholesaleClaim,
  WholesaleClaimNextStatus,
  WholesaleClaimStatus,
} from '../types/wholesaleManagement'
import { formatDateTime } from '../utils/dateTime'

const auth = useAuthStore()
const claims = ref<WholesaleClaim[]>([])
const status = ref<WholesaleClaimStatus | ''>('')
const loading = ref(false)
const processingSeq = ref<number | null>(null)
const error = ref('')
const message = ref('')

const claimTypeLabel = (value: WholesaleClaim['claim_type']) =>
  value === 'CANCEL' ? '취소' : '반품'
const statusLabel = (value: WholesaleClaimStatus) =>
  ({ REQUESTED: '접수', APPROVED: '승인', REJECTED: '거절', COMPLETED: '완료' })[value]

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
  message.value = ''
  try {
    claims.value = await authorized((token) =>
      wholesaleManagementApi.claims(token, status.value || undefined),
    )
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '클레임을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function updateStatus(claim: WholesaleClaim, nextStatus: WholesaleClaimNextStatus) {
  if (processingSeq.value !== null) return
  const action = statusLabel(nextStatus)
  if (
    !window.confirm(
      `${claim.order_no}의 ${claimTypeLabel(claim.claim_type)} 요청을 ${action} 처리하시겠습니까?`,
    )
  )
    return
  processingSeq.value = claim.seq
  error.value = ''
  message.value = ''
  try {
    const updated = await authorized((token) =>
      wholesaleManagementApi.updateClaimStatus(token, claim.seq, nextStatus),
    )
    if (status.value && updated.status !== status.value) {
      claims.value = claims.value.filter((item) => item.seq !== updated.seq)
    } else {
      claims.value = claims.value.map((item) => (item.seq === updated.seq ? updated : item))
    }
    message.value = `${claim.order_no} 클레임을 ${action} 처리했습니다.`
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '클레임 상태를 변경하지 못했습니다.'
  } finally {
    processingSeq.value = null
  }
}

onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>RETURNS & CANCELLATIONS</p>
        <h1>반품·취소</h1>
        <span>소유 도매 매장 상품의 취소·반품 요청을 확인하고 처리합니다.</span>
      </div>
    </div>

    <form class="admin-list-filters" @submit.prevent="load">
      <label>
        <span>처리 상태</span>
        <select v-model="status">
          <option value="">전체</option>
          <option value="REQUESTED">접수</option>
          <option value="APPROVED">승인</option>
          <option value="REJECTED">거절</option>
          <option value="COMPLETED">완료</option>
        </select>
      </label>
      <button class="admin-primary-button" :disabled="loading">조회</button>
    </form>

    <p v-if="message" class="order-action-message">{{ message }}</p>
    <p v-if="error" class="admin-list-error">
      {{ error }} <button type="button" @click="load">다시 조회</button>
    </p>

    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>클레임 목록</h2>
          <span>{{ claims.length }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table wholesale-claims-table">
          <thead>
            <tr>
              <th>접수일</th>
              <th>주문</th>
              <th>도매 매장</th>
              <th>상품</th>
              <th>유형</th>
              <th>수량</th>
              <th>사유</th>
              <th>상태</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="admin-empty">클레임을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="claim in claims" v-else :key="claim.seq">
              <td>{{ formatDateTime(claim.created_at) }}</td>
              <td>
                <strong>{{ claim.order_no }}</strong
                ><small>#{{ claim.order_seq }} · 품목 #{{ claim.order_item_seq }}</small>
              </td>
              <td>
                {{ claim.store_name }}<small>#{{ claim.wholesale_store_seq }}</small>
              </td>
              <td>{{ claim.product_name_snapshot }}</td>
              <td>{{ claimTypeLabel(claim.claim_type) }}</td>
              <td>{{ claim.quantity }}개</td>
              <td>{{ claim.reason || '-' }}</td>
              <td>
                <i class="admin-status">{{ statusLabel(claim.status) }}</i
                ><small v-if="claim.processed_at">{{ formatDateTime(claim.processed_at) }}</small>
              </td>
              <td>
                <div v-if="claim.status === 'REQUESTED'" class="claim-actions">
                  <button
                    type="button"
                    :disabled="processingSeq !== null"
                    @click="updateStatus(claim, 'APPROVED')"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    :disabled="processingSeq !== null"
                    @click="updateStatus(claim, 'REJECTED')"
                  >
                    거절
                  </button>
                </div>
                <button
                  v-else-if="claim.status === 'APPROVED'"
                  type="button"
                  :disabled="processingSeq !== null"
                  @click="updateStatus(claim, 'COMPLETED')"
                >
                  완료 처리
                </button>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="!loading && !claims.length">
              <td colspan="9" class="admin-empty">조건에 맞는 클레임이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <p class="admin-dashboard-guide">
      처리 순서는 접수 → 승인 → 완료 또는 접수 → 거절입니다. 처리 완료 후에는 이전 상태로 되돌릴 수
      없습니다.
    </p>
  </main>
</template>

<style scoped>
.wholesale-claims-table {
  min-width: 1180px;
}
.wholesale-claims-table small {
  display: block;
  margin-top: 4px;
  color: #85817a;
  font-size: 10px;
}
.claim-actions {
  display: flex;
  gap: 6px;
}
</style>
