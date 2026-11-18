<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ApiError } from '../services/httpClient'
import { wholesaleManagementApi } from '../services/wholesaleManagementApi'
import { useAuthStore } from '../stores/auth'
import type { WholesaleBusinessRow } from '../types/wholesaleManagement'
import { approvalStatuses, storeStatuses } from '../data/adminStatuses'
const auth = useAuthStore()
const rows = ref<WholesaleBusinessRow[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const editing = ref<number | null>(null)
const modal = ref<HTMLDialogElement | null>(null)
const modalError = ref('')
const success = ref('')
const fieldErrors = ref<Record<string, string>>({})
const profiles = computed(() => [
  ...new Map(rows.value.map((row) => [row.business_profile_seq, row])).values(),
])
const selectedProfile = computed(() =>
  profiles.value.find((row) => row.business_profile_seq === form.businessProfileSeq),
)
const allowedStoreStatuses = storeStatuses.filter((item) => item.value !== 'SUSPENDED')
const statusLabel = (value: string | null) =>
  storeStatuses.find((item) => item.value === value)?.label ?? value ?? '-'
const approvalLabel = (value: string) =>
  approvalStatuses.find((item) => item.value === value)?.label ?? value
const form = reactive({
  businessProfileSeq: null as number | null,
  storeName: '',
  marketName: '',
  floorRoom: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
})
function closeModal() {
  if (!saving.value) modal.value?.close()
}
function register(row?: WholesaleBusinessRow) {
  editing.value = null
  modalError.value = ''
  fieldErrors.value = {}
  success.value = ''
  Object.assign(form, {
    businessProfileSeq:
      row?.business_profile_seq ??
      (profiles.value.length === 1 ? profiles.value[0]!.business_profile_seq : null),
    storeName: '',
    marketName: '',
    floorRoom: '',
    status: 'ACTIVE',
  })
  modal.value?.showModal()
}
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
    rows.value = await authorized(wholesaleManagementApi.business)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '사업자 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}
function edit(row: WholesaleBusinessRow) {
  if (row.wholesale_store_seq == null) return
  editing.value = row.wholesale_store_seq
  modalError.value = ''
  fieldErrors.value = {}
  success.value = ''
  Object.assign(form, {
    businessProfileSeq: row.business_profile_seq,
    storeName: row.store_name ?? '',
    marketName: row.market_name ?? '',
    floorRoom: row.floor_room ?? '',
    status: row.store_status ?? 'ACTIVE',
  })
  modal.value?.showModal()
}
async function save() {
  if (saving.value) return
  modalError.value = ''
  fieldErrors.value = {}
  if (!selectedProfile.value || !form.storeName.trim()) {
    modalError.value = '본인 사업자를 선택하고 사업장명을 입력해 주세요.'
    return
  }
  saving.value = true
  try {
    const body = {
      storeName: form.storeName.trim(),
      marketName: form.marketName.trim() || null,
      floorRoom: form.floorRoom.trim() || null,
      status: form.status,
    }
    const storeSeq = editing.value
    const businessProfileSeq = selectedProfile.value.business_profile_seq
    await authorized((token) =>
      storeSeq === null
        ? wholesaleManagementApi.createStore(token, { ...body, businessProfileSeq })
        : wholesaleManagementApi.updateStore(token, storeSeq, body),
    )
    modal.value?.close()
    success.value = storeSeq === null ? '매장이 등록되었습니다.' : '매장 정보가 수정되었습니다.'
    await load()
  } catch (cause) {
    fieldErrors.value = cause instanceof ApiError ? cause.fieldErrors : {}
    modalError.value = cause instanceof Error ? cause.message : '매장을 저장하지 못했습니다.'
  } finally {
    saving.value = false
  }
}
onMounted(load)
onBeforeUnmount(() => modal.value?.close())
</script>
<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>BUSINESS & STORES</p>
        <h1>사업자·매장 관리</h1>
        <span>연결된 도매 사업자와 소유 매장을 확인하고 등록·수정합니다.</span>
      </div>
      <button
        class="admin-primary-button"
        type="button"
        :disabled="loading || !!error || !profiles.length"
        @click="register()"
      >
        + 매장 등록
      </button>
    </div>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <p v-if="success" class="wholesale-store-success" role="status">{{ success }}</p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>사업자·매장</h2>
          <span>{{ rows.length }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table">
          <thead>
            <tr>
              <th>사업자 SEQ</th>
              <th>사업자번호</th>
              <th>사업자명</th>
              <th>대표자</th>
              <th>승인</th>
              <th>매장 SEQ</th>
              <th>사업장명</th>
              <th>시장·위치</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" class="admin-empty">정보를 불러오는 중입니다.</td>
            </tr>
            <tr
              v-for="row in rows"
              v-else
              :key="`${row.business_profile_seq}-${row.wholesale_store_seq ?? 0}`"
            >
              <td>{{ row.business_profile_seq }}</td>
              <td>{{ row.business_number }}</td>
              <td>{{ row.company_name }}</td>
              <td>{{ row.representative_name }}</td>
              <td>
                <i class="admin-status">{{ approvalLabel(row.approval_status) }}</i>
              </td>
              <td>{{ row.wholesale_store_seq ?? '-' }}</td>
              <td>{{ row.store_name ?? '연결 매장 없음' }}</td>
              <td>{{ [row.market_name, row.floor_room].filter(Boolean).join(' ') || '-' }}</td>
              <td>{{ statusLabel(row.store_status) }}</td>
              <td>
                <button
                  v-if="row.wholesale_store_seq !== null"
                  class="admin-table-action"
                  type="button"
                  :disabled="!!error"
                  @click="edit(row)"
                >
                  수정
                </button>
                <button
                  v-else
                  class="admin-table-action"
                  type="button"
                  :disabled="!!error"
                  @click="register(row)"
                >
                  매장 등록
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="10" class="admin-empty">
                연결된 사업자가 없습니다. 사업자 등록을 먼저 확인해 주세요.
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
      class="admin-product-modal wholesale-store-modal"
      aria-labelledby="wholesale-store-title"
      @cancel.prevent="closeModal"
      @click.self="closeModal"
    >
      <div class="admin-modal-heading">
        <div>
          <p>{{ editing === null ? 'NEW WHOLESALE STORE' : 'EDIT WHOLESALE STORE' }}</p>
          <h2 id="wholesale-store-title">
            {{ editing === null ? '도매 매장 등록' : '도매 매장 수정' }}
          </h2>
        </div>
        <button type="button" aria-label="팝업 닫기" :disabled="saving" @click="closeModal">
          ×
        </button>
      </div>
      <form class="admin-common-form wholesale-store-form" @submit.prevent="save">
        <fieldset :disabled="saving">
          <div class="admin-full-form-grid">
            <label class="wide"
              ><span>사업자 <em>필수</em></span>
              <select v-model="form.businessProfileSeq" required :disabled="editing !== null">
                <option :value="null" disabled>본인 사업자를 선택하세요</option>
                <option
                  v-for="profile in profiles"
                  :key="profile.business_profile_seq"
                  :value="profile.business_profile_seq"
                >
                  {{ profile.company_name }} (사업자 SEQ {{ profile.business_profile_seq }})
                </option>
              </select>
              <small v-if="fieldErrors.businessProfileSeq" class="field-error">{{
                fieldErrors.businessProfileSeq
              }}</small>
            </label>
            <div v-if="selectedProfile" class="wholesale-store-profile wide">
              <span
                >사업자번호 <strong>{{ selectedProfile.business_number }}</strong></span
              >
              <span
                >대표자 <strong>{{ selectedProfile.representative_name }}</strong></span
              >
            </div>
            <label class="wide"
              ><span>사업장명 <em>필수</em></span
              ><input
                v-model="form.storeName"
                maxlength="150"
                required
                placeholder="도매 매장 이름을 입력하세요"
              /><small v-if="fieldErrors.storeName" class="field-error">{{
                fieldErrors.storeName
              }}</small></label
            >
            <label
              ><span>시장명</span
              ><input
                v-model="form.marketName"
                maxlength="100"
                placeholder="동대문 상가명 등"
              /><small v-if="fieldErrors.marketName" class="field-error">{{
                fieldErrors.marketName
              }}</small></label
            >
            <label
              ><span>층·호수</span
              ><input
                v-model="form.floorRoom"
                maxlength="50"
                placeholder="층과 호수를 입력하세요"
              /><small v-if="fieldErrors.floorRoom" class="field-error">{{
                fieldErrors.floorRoom
              }}</small></label
            >
            <label
              ><span>매장 상태 <em>필수</em></span
              ><select v-model="form.status" required>
                <option v-for="item in allowedStoreStatuses" :key="item.value" :value="item.value">
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
            :disabled="saving || !selectedProfile || !form.storeName.trim()"
          >
            {{ saving ? '저장 중...' : editing === null ? '매장 등록' : '변경사항 저장' }}
          </button>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>

<style scoped>
.wholesale-store-modal {
  margin: auto;
  border: 0;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
}
.wholesale-store-modal::backdrop {
  background: rgba(18, 20, 22, 0.55);
}
.wholesale-store-form {
  margin: 0;
  padding: 0;
  border: 0;
}
.wholesale-store-form fieldset {
  min-width: 0;
  padding: 0;
  border: 0;
}
.wholesale-store-profile {
  grid-column: 1 / -1;
  padding: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  background: #f7f8f9;
  border-radius: 5px;
  color: #70747a;
  font-size: 11px;
}
.wholesale-store-profile strong {
  margin-left: 8px;
  color: #292c30;
}
.wholesale-store-success {
  margin-bottom: 18px;
  color: #24704a;
  font-size: 12px;
}
@media (max-width: 560px) {
  .wholesale-store-modal {
    width: calc(100% - 24px);
    padding: 20px;
  }
  .wholesale-store-form .admin-full-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
