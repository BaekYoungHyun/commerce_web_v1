<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ApiError } from '../services/httpClient'
import { wholesaleFulfillmentApi } from '../services/wholesaleFulfillmentApi'
import { wholesaleManagementApi } from '../services/wholesaleManagementApi'
import { useAuthStore } from '../stores/auth'
import type { WholesaleOwnedStore } from '../types/wholesaleFulfillment'
import type { PayoutAccount, WholesaleSettlement } from '../types/wholesaleManagement'

const auth = useAuthStore()
const settlements = ref<WholesaleSettlement[]>([])
const stores = ref<WholesaleOwnedStore[]>([])
const payoutAccounts = ref<PayoutAccount[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const message = ref('')
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const firstDay = `${today.slice(0, 8)}01`
const form = reactive({ periodStart: firstDay, periodEnd: today, wholesaleStoreSeq: '' })
const payoutForm = reactive({ storeSeq: '', bankName: '', accountNumber: '', accountHolder: '' })
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
    const [settlementList, ownedStores, accounts] = await Promise.all([
      authorized(wholesaleManagementApi.settlements),
      authorized(wholesaleFulfillmentApi.stores),
      authorized(wholesaleManagementApi.payoutAccounts),
    ])
    settlements.value = settlementList
    stores.value = ownedStores
    payoutAccounts.value = accounts
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '정산 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function selectPayoutStore() {
  const account = payoutAccounts.value.find(
    (item) => item.wholesale_store_seq === Number(payoutForm.storeSeq),
  )
  Object.assign(payoutForm, {
    bankName: account?.bank_name ?? '',
    accountNumber: account?.account_number ?? '',
    accountHolder: account?.account_holder ?? '',
  })
}

async function savePayoutAccount() {
  if (
    !payoutForm.storeSeq ||
    !payoutForm.bankName.trim() ||
    !payoutForm.accountNumber.trim() ||
    !payoutForm.accountHolder.trim()
  )
    return
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    await authorized((token) =>
      wholesaleManagementApi.savePayoutAccount(token, Number(payoutForm.storeSeq), {
        bankName: payoutForm.bankName.trim(),
        accountNumber: payoutForm.accountNumber.trim(),
        accountHolder: payoutForm.accountHolder.trim(),
      }),
    )
    payoutAccounts.value = await authorized(wholesaleManagementApi.payoutAccounts)
    message.value = '정산계좌를 저장했습니다.'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '정산계좌를 저장하지 못했습니다.'
  } finally {
    saving.value = false
  }
}

async function generate() {
  if (saving.value) return
  if (form.periodEnd < form.periodStart) {
    error.value = '정산 종료일은 시작일보다 빠를 수 없습니다.'
    return
  }
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    settlements.value = await authorized((token) =>
      wholesaleManagementApi.generateSettlements(token, {
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        ...(form.wholesaleStoreSeq ? { wholesaleStoreSeq: Number(form.wholesaleStoreSeq) } : {}),
      }),
    )
    message.value =
      '정산 산출이 완료되었습니다. 같은 매장·기간의 기존 정산은 중복 생성되지 않습니다.'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '정산을 산출하지 못했습니다.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>SETTLEMENTS</p>
        <h1>정산 관리</h1>
        <span>결제 완료 주문을 기준으로 매장별 정산을 산출하고 지급 예정 금액을 확인합니다.</span>
      </div>
    </div>
    <form class="admin-common-form" @submit.prevent="generate">
      <div class="admin-common-form-grid">
        <label
          ><span>정산 시작일</span><input v-model="form.periodStart" type="date" required
        /></label>
        <label
          ><span>정산 종료일</span><input v-model="form.periodEnd" type="date" required
        /></label>
        <label>
          <span>도매 매장</span>
          <select v-model="form.wholesaleStoreSeq">
            <option value="">소유 매장 전체</option>
            <option v-for="store in stores" :key="store.seq" :value="String(store.seq)">
              {{ store.businessProfileName ?? '사업자명 없음' }} · {{ store.storeName }} ({{
                store.userId ?? '사용자 미연결'
              }})
            </option>
          </select>
        </label>
      </div>
      <div class="admin-common-form-actions">
        <button class="admin-primary-button" :disabled="saving || loading">
          {{ saving ? '산출 중' : '정산 산출' }}
        </button>
      </div>
    </form>
    <form class="admin-common-form" @submit.prevent="savePayoutAccount">
      <h2>정산계좌</h2>
      <div class="admin-common-form-grid">
        <label
          ><span>도매 매장</span
          ><select v-model="payoutForm.storeSeq" required @change="selectPayoutStore">
            <option value="">매장 선택</option>
            <option v-for="store in stores" :key="store.seq" :value="String(store.seq)">
              {{ store.businessProfileName ?? '사업자명 없음' }} · {{ store.storeName }}
            </option>
          </select></label
        >
        <label
          ><span>은행명</span><input v-model="payoutForm.bankName" maxlength="80" required
        /></label>
        <label
          ><span>계좌번호</span><input v-model="payoutForm.accountNumber" maxlength="100" required
        /></label>
        <label
          ><span>예금주</span><input v-model="payoutForm.accountHolder" maxlength="100" required
        /></label>
      </div>
      <div class="admin-common-form-actions">
        <button class="admin-primary-button" :disabled="saving">계좌 저장</button>
      </div>
    </form>
    <p v-if="message" class="order-action-message">{{ message }}</p>
    <p v-if="error" class="admin-list-error">
      {{ error }} <button type="button" @click="load">다시 조회</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>정산 내역</h2>
          <span>{{ settlements.length }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table">
          <thead>
            <tr>
              <th>매장</th>
              <th>정산 기간</th>
              <th>총 거래액</th>
              <th>수수료</th>
              <th>지급 예정액</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="admin-empty">정산 내역을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="item in settlements" v-else :key="item.seq">
              <td>
                {{ item.store_name }} <small>#{{ item.wholesale_store_seq }}</small>
              </td>
              <td>{{ item.period_start }} ~ {{ item.period_end }}</td>
              <td>{{ money(item.gross_amount) }}원</td>
              <td>{{ money(item.commission_amount) }}원</td>
              <td>
                <strong>{{ money(item.payout_amount) }}원</strong>
              </td>
              <td>
                <i class="admin-status">{{ item.status }}</i>
              </td>
            </tr>
            <tr v-if="!loading && !settlements.length">
              <td colspan="6" class="admin-empty">정산 내역이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <p class="admin-dashboard-guide">
      현재 초기 수수료율은 0이며, 실제 PG 승인·환불·지급 확정 기능은 포함되지 않습니다.
    </p>
  </main>
</template>
