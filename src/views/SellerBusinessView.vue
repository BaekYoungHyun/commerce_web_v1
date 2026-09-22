<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ApiError } from '../services/httpClient'
import { useSellerAdminStore } from '../stores/sellerAdmin'
import type { SellerEditableStoreStatus } from '../types/sellerAdmin'
import { approvalStatuses, storeStatuses } from '../data/adminStatuses'

const store = useSellerAdminStore()
const { business, loading, saving, error } = storeToRefs(store)
const selectedProfileSeq = ref<number | null>(null)
const editingStoreSeq = ref<number | null>(null)
const modal = ref<HTMLDialogElement | null>(null)
const modalError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const success = ref('')
const refreshFailed = ref(false)
let modalTrigger: HTMLElement | null = null
const profiles = computed(() => business.value?.businessProfiles ?? [])
const selectedProfile = computed(() =>
  profiles.value.find((item) => item.seq === selectedProfileSeq.value),
)
const visibleStores = computed(() => selectedProfile.value?.stores ?? [])
const isEditing = computed(() => editingStoreSeq.value !== null)
const allowedStatuses = storeStatuses.filter(
  (item) => item.value === 'ACTIVE' || item.value === 'INACTIVE',
)
const form = reactive({
  businessProfileSeq: null as number | null,
  storeName: '',
  salesChannel: '',
  status: 'ACTIVE' as SellerEditableStoreStatus | '',
})
const formProfile = computed(() =>
  profiles.value.find((item) => item.seq === form.businessProfileSeq),
)
const approvalLabel = (value: string) =>
  approvalStatuses.find((item) => item.value === value)?.label ?? value
const statusLabel = (value: string) =>
  storeStatuses.find((item) => item.value === value)?.label ?? value
const validStatus = (value: string): value is SellerEditableStoreStatus =>
  value === 'ACTIVE' || value === 'INACTIVE'

async function loadBusiness(preferred = selectedProfileSeq.value, afterSave = false) {
  try {
    const response = await store.fetchBusiness()
    const list = response.businessProfiles
    selectedProfileSeq.value = list.some((item) => item.seq === preferred)
      ? preferred
      : list.length === 1
        ? list[0]!.seq
        : (list[0]?.seq ?? null)
    refreshFailed.value = false
  } catch {
    refreshFailed.value = afterSave
  }
}
function resetMessages() {
  modalError.value = ''
  fieldErrors.value = {}
  success.value = ''
}
async function openCreate(event: Event, profileSeq = selectedProfileSeq.value) {
  if (profileSeq === null || !profiles.value.some((item) => item.seq === profileSeq)) return
  modalTrigger = event.currentTarget as HTMLElement
  resetMessages()
  editingStoreSeq.value = null
  Object.assign(form, {
    businessProfileSeq: profileSeq,
    storeName: '',
    salesChannel: '',
    status: 'ACTIVE',
  })
  modal.value?.showModal()
  await nextTick()
  modal.value?.querySelector<HTMLInputElement>('input[name="storeName"]')?.focus()
}
async function openEdit(storeItem: (typeof visibleStores.value)[number], event: Event) {
  modalTrigger = event.currentTarget as HTMLElement
  resetMessages()
  editingStoreSeq.value = storeItem.seq
  Object.assign(form, {
    businessProfileSeq: storeItem.businessProfileSeq,
    storeName: storeItem.storeName,
    salesChannel: storeItem.salesChannel ?? '',
    status: validStatus(storeItem.status) ? storeItem.status : '',
  })
  modal.value?.showModal()
  await nextTick()
  modal.value?.querySelector<HTMLInputElement>('input[name="storeName"]')?.focus()
}
function closeModal() {
  if (!saving.value) modal.value?.close()
}
function restoreFocus() {
  modalTrigger?.focus()
  modalTrigger = null
}
async function save() {
  if (saving.value) return
  modalError.value = ''
  fieldErrors.value = {}
  if (!formProfile.value || !form.storeName.trim() || !validStatus(form.status)) {
    modalError.value = '본인 사업자, 매장명과 매장 상태를 확인해 주세요.'
    return
  }
  const profileSeq = formProfile.value.seq
  const body = {
    storeName: form.storeName.trim(),
    salesChannel: form.salesChannel.trim() || null,
    status: form.status,
  }
  try {
    await store.saveStore(
      isEditing.value ? body : { ...body, businessProfileSeq: profileSeq },
      editingStoreSeq.value ?? undefined,
    )
  } catch (cause) {
    fieldErrors.value = cause instanceof ApiError ? cause.fieldErrors : {}
    modalError.value = cause instanceof Error ? cause.message : '매장을 저장하지 못했습니다.'
    return
  }
  const action = isEditing.value ? '수정' : '등록'
  success.value = `매장이 ${action}되었습니다.`
  modal.value?.close()
  await loadBusiness(profileSeq, true)
  if (refreshFailed.value) success.value = `매장 ${action} 완료, 목록 갱신 실패`
}
onMounted(() => loadBusiness())
onBeforeUnmount(() => modal.value?.close())
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>BUSINESS & STORES</p>
        <h1>사업자·매장 관리</h1>
        <span>로그인 사용자에게 연결된 소매 사업자와 매장을 확인하고 등록·수정합니다.</span>
      </div>
      <button
        class="admin-primary-button"
        type="button"
        :disabled="loading || !!error || !selectedProfile"
        @click="openCreate"
      >
        + 매장 등록
      </button>
    </div>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ refreshFailed ? '저장은 완료됐지만 목록을 갱신하지 못했습니다.' : error }}
      <button type="button" @click="loadBusiness()">다시 시도</button>
    </p>
    <p v-if="success" class="seller-business-success" role="status">{{ success }}</p>
    <section v-if="profiles.length" class="admin-filter-panel seller-business-profile-filter">
      <label
        ><span>사업자 선택</span
        ><select v-model="selectedProfileSeq" :disabled="loading">
          <option v-for="profile in profiles" :key="profile.seq" :value="profile.seq">
            {{ profile.companyName }} (사업자 SEQ {{ profile.seq }})
          </option>
        </select></label
      >
    </section>
    <section
      v-if="selectedProfile"
      class="admin-summary seller-business-summary"
      aria-label="사업자 정보"
    >
      <div>
        <span>사업자명</span><strong>{{ selectedProfile.companyName }}</strong>
      </div>
      <div>
        <span>사업자등록번호</span><strong>{{ selectedProfile.businessNumber }}</strong>
      </div>
      <div>
        <span>대표자</span><strong>{{ selectedProfile.representativeName }}</strong>
      </div>
      <div>
        <span>승인 상태</span><strong>{{ approvalLabel(selectedProfile.approvalStatus) }}</strong>
      </div>
    </section>
    <section class="admin-table-panel seller-business-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>소매 매장</h2>
          <span>{{ visibleStores.length }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table seller-business-table">
          <thead>
            <tr>
              <th>매장명</th>
              <th>판매 채널</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !business">
              <td colspan="4" class="admin-empty">정보를 불러오는 중입니다.</td>
            </tr>
            <tr v-for="storeItem in visibleStores" v-else :key="storeItem.seq">
              <td>
                <strong>{{ storeItem.storeName }}</strong>
              </td>
              <td>{{ storeItem.salesChannel ?? '판매 채널 미등록' }}</td>
              <td>
                <i class="admin-status">{{ statusLabel(storeItem.status) }}</i>
              </td>
              <td>
                <button
                  class="admin-table-action"
                  type="button"
                  :disabled="!!error"
                  @click="openEdit(storeItem, $event)"
                >
                  수정
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !error && !profiles.length">
              <td colspan="4" class="admin-empty">
                연결된 사업자가 없습니다. 사업자 등록을 먼저 확인해 주세요.
              </td>
            </tr>
            <tr v-else-if="!loading && selectedProfile && !visibleStores.length">
              <td colspan="4" class="admin-empty">
                등록된 소매 매장이 없습니다. 매장을 등록해 주세요.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
  <Teleport to="body">
    <dialog
      ref="modal"
      class="admin-product-modal seller-store-modal"
      aria-labelledby="seller-store-title"
      @cancel.prevent="closeModal"
      @close="restoreFocus"
      @click.self="closeModal"
    >
      <div class="admin-modal-heading">
        <div>
          <p>{{ isEditing ? 'EDIT RETAIL STORE' : 'NEW RETAIL STORE' }}</p>
          <h2 id="seller-store-title">{{ isEditing ? '소매 매장 수정' : '소매 매장 등록' }}</h2>
        </div>
        <button type="button" aria-label="팝업 닫기" :disabled="saving" @click="closeModal">
          ×
        </button>
      </div>
      <form class="admin-common-form seller-store-form" @submit.prevent="save">
        <fieldset :disabled="saving">
          <div class="admin-full-form-grid">
            <label class="wide"
              ><span>사업자 <em>필수</em></span
              ><select v-model="form.businessProfileSeq" required :disabled="isEditing">
                <option :value="null" disabled>본인 사업자를 선택하세요</option>
                <option v-for="profile in profiles" :key="profile.seq" :value="profile.seq">
                  {{ profile.companyName }} (사업자 SEQ {{ profile.seq }})
                </option></select
              ><small v-if="fieldErrors.businessProfileSeq" class="field-error">{{
                fieldErrors.businessProfileSeq
              }}</small></label
            >
            <div v-if="formProfile" class="seller-store-profile wide">
              <span
                >사업자명 <strong>{{ formProfile.companyName }}</strong></span
              ><span
                >사업자등록번호 <strong>{{ formProfile.businessNumber }}</strong></span
              >
              <span
                >대표자 <strong>{{ formProfile.representativeName }}</strong></span
              ><span
                >승인 상태 <strong>{{ approvalLabel(formProfile.approvalStatus) }}</strong></span
              >
            </div>
            <label class="wide"
              ><span>매장명 <em>필수</em></span
              ><input
                name="storeName"
                v-model="form.storeName"
                maxlength="150"
                required
                placeholder="소매 매장 이름을 입력하세요"
              /><small v-if="fieldErrors.storeName" class="field-error">{{
                fieldErrors.storeName
              }}</small></label
            >
            <label
              ><span>판매 채널</span
              ><input
                v-model="form.salesChannel"
                maxlength="50"
                placeholder="온라인몰, 오프라인, SNS 등"
              /><small v-if="fieldErrors.salesChannel" class="field-error">{{
                fieldErrors.salesChannel
              }}</small></label
            >
            <label
              ><span>매장 상태 <em>필수</em></span
              ><select v-model="form.status" required>
                <option value="" disabled>상태를 선택하세요</option>
                <option v-for="item in allowedStatuses" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option></select
              ><small v-if="fieldErrors.status" class="field-error">{{
                fieldErrors.status
              }}</small></label
            >
          </div>
        </fieldset>
        <p v-if="modalError" class="admin-form-error" role="alert">{{ modalError }}</p>
        <div class="admin-modal-actions">
          <button type="button" :disabled="saving" @click="closeModal">취소</button
          ><button
            class="admin-primary-button"
            type="submit"
            :disabled="saving || !form.storeName.trim() || !validStatus(form.status)"
          >
            {{ saving ? '저장 중...' : isEditing ? '변경사항 저장' : '매장 등록' }}
          </button>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>

<style scoped>
.seller-business-profile-filter {
  grid-template-columns: minmax(260px, 420px);
}
.seller-business-summary {
  margin-bottom: 18px;
}
.seller-business-summary > div strong {
  font-size: 15px;
  overflow-wrap: anywhere;
}
.seller-business-table {
  min-width: 680px;
}
.seller-store-modal {
  margin: auto;
  border: 0;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
}
.seller-store-modal::backdrop {
  background: rgba(18, 20, 22, 0.55);
}
.seller-store-form {
  margin: 0;
  padding: 0;
  border: 0;
}
.seller-store-form fieldset {
  min-width: 0;
  padding: 0;
  border: 0;
}
.seller-store-profile {
  grid-column: 1 / -1;
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px 22px;
  border-radius: 5px;
  background: #f7f8f9;
  color: #70747a;
  font-size: 10px;
}
.seller-store-profile strong {
  margin-left: 7px;
  color: #292c30;
}
.seller-business-success {
  margin-bottom: 18px;
  color: #24704a;
  font-size: 12px;
}
@media (max-width: 560px) {
  .seller-store-modal {
    width: calc(100% - 24px);
    padding: 20px;
  }
  .seller-store-form .admin-full-form-grid,
  .seller-store-profile {
    grid-template-columns: 1fr;
  }
}
</style>
