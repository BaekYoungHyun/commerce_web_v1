<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSellerAdminStore } from '../stores/sellerAdmin'
import type { SellerAddress } from '../types/sellerAdmin'
const store = useSellerAdminStore()
const { addresses, loading, saving, error } = storeToRefs(store)
const editingSeq = ref<number | null>(null)
const open = ref(false)
const form = reactive({
  retailStoreSeq: 0,
  postalCode: '',
  address1: '',
  address2: '',
  isDefault: false,
})
function edit(item?: SellerAddress) {
  editingSeq.value = item?.seq ?? null
  Object.assign(
    form,
    item
      ? {
          retailStoreSeq: item.retail_store_seq,
          postalCode: item.postal_code,
          address1: item.address1,
          address2: item.address2 ?? '',
          isDefault: item.is_default,
        }
      : { retailStoreSeq: 0, postalCode: '', address1: '', address2: '', isDefault: false },
  )
  open.value = true
}
async function submit() {
  if (form.retailStoreSeq < 1 || !form.postalCode.trim() || !form.address1.trim()) return
  await store
    .saveAddress(
      {
        ...form,
        postalCode: form.postalCode.trim(),
        address1: form.address1.trim(),
        address2: form.address2.trim() || null,
      },
      editingSeq.value ?? undefined,
    )
    .then(() => (open.value = false))
    .catch(() => undefined)
}
onMounted(() => store.fetchAddresses().catch(() => undefined))
</script>
<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>SHIPPING ADDRESSES</p>
        <h1>배송지 관리</h1>
        <span>소매 매장별 주문 배송지를 관리합니다.</span>
      </div>
      <button class="admin-primary-button" @click="edit()">+ 배송지 등록</button>
    </div>
    <form v-if="open" class="admin-common-form" @submit.prevent="submit">
      <div class="admin-common-form-grid">
        <label
          ><span>소매 매장 ID</span
          ><input v-model.number="form.retailStoreSeq" min="1" type="number" required /></label
        ><label><span>우편번호</span><input v-model="form.postalCode" required /></label>
      </div>
      <label><span>기본 주소</span><input v-model="form.address1" required /></label
      ><label><span>상세 주소</span><input v-model="form.address2" /></label
      ><label
        ><span><input v-model="form.isDefault" type="checkbox" /> 기본 배송지로 설정</span></label
      >
      <div class="admin-common-form-actions">
        <button type="button" @click="open = false">취소</button
        ><button class="admin-primary-button" :disabled="saving">저장</button>
      </div>
    </form>
    <p v-if="error" class="admin-list-error">{{ error }}</p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>배송지 목록</h2>
          <span>{{ addresses.length }}건</span>
        </div>
      </div>
      <div v-if="loading" class="admin-common-state">배송지를 불러오는 중입니다.</div>
      <div v-else class="admin-common-list">
        <article v-for="item in addresses" :key="item.seq">
          <header>
            <div>
              <span>매장 #{{ item.retail_store_seq }}</span>
              <h3>{{ item.address1 }} {{ item.address2 }}</h3>
            </div>
            <i v-if="item.is_default" class="admin-status">기본 배송지</i>
          </header>
          <p>{{ item.postal_code }}</p>
          <div class="admin-row-actions">
            <button @click="edit(item)">수정</button
            ><button @click="store.removeAddress(item.seq).catch(() => undefined)">삭제</button>
          </div>
        </article>
        <div v-if="!addresses.length" class="admin-common-state">등록된 배송지가 없습니다.</div>
      </div>
    </section>
  </main>
</template>
