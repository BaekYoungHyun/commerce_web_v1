<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSellerAdminStore } from '../stores/sellerAdmin'
import { formatDateTime } from '../utils/dateTime'
const store = useSellerAdminStore()
const { payments, loading, saving, error } = storeToRefs(store)
const open = ref(false)
const form = reactive({ paymentSeq: 0, amount: 0, reason: '' })
const money = (v: number) => v.toLocaleString('ko-KR')
function refund(seq: number, amount: number) {
  Object.assign(form, { paymentSeq: seq, amount, reason: '' })
  open.value = true
}
async function submit() {
  if (form.paymentSeq < 1 || form.amount < 1) return
  await store
    .requestRefund({
      paymentSeq: form.paymentSeq,
      amount: form.amount,
      reason: form.reason.trim() || null,
    })
    .then(() => (open.value = false))
    .catch(() => undefined)
}
onMounted(() => store.fetchPayments().catch(() => undefined))
</script>
<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>PAYMENTS & REFUNDS</p>
        <h1>결제·환불</h1>
        <span>주문 결제 상태와 환불 진행 상황을 확인합니다.</span>
      </div>
    </div>
    <form v-if="open" class="admin-common-form" @submit.prevent="submit">
      <div class="admin-common-form-grid">
        <label><span>결제 ID</span><input :value="form.paymentSeq" readonly /></label
        ><label
          ><span>환불 금액</span><input v-model.number="form.amount" min="1" type="number" required
        /></label>
      </div>
      <label><span>환불 사유</span><textarea v-model="form.reason" rows="3" /></label>
      <div class="admin-common-form-actions">
        <button type="button" @click="open = false">취소</button
        ><button class="admin-primary-button" :disabled="saving">환불 요청</button>
      </div>
    </form>
    <p v-if="error" class="admin-list-error">{{ error }}</p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>결제 내역</h2>
          <span>{{ payments.length }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table">
          <thead>
            <tr>
              <th>주문번호</th>
              <th>결제수단</th>
              <th>상태</th>
              <th>금액</th>
              <th>결제일</th>
              <th>환불</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="admin-empty">불러오는 중입니다.</td>
            </tr>
            <tr v-for="item in payments" v-else :key="item.payment_seq">
              <td>{{ item.order_no }}</td>
              <td>{{ item.payment_method }}</td>
              <td>
                <i class="admin-status">{{ item.status }}</i>
              </td>
              <td>{{ money(item.amount) }}원</td>
              <td>{{ formatDateTime(item.paid_at) }}</td>
              <td>
                {{ item.refund_status ?? '-'
                }}<template v-if="item.refund_amount">
                  · {{ money(item.refund_amount) }}원</template
                >
              </td>
              <td>
                <button
                  v-if="item.status === 'PAID'"
                  @click="refund(item.payment_seq, item.amount)"
                >
                  환불 요청
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !payments.length">
              <td colspan="7" class="admin-empty">결제 내역이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
