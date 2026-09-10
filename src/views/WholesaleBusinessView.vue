<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ApiError } from '../services/httpClient'
import { wholesaleManagementApi } from '../services/wholesaleManagementApi'
import { useAuthStore } from '../stores/auth'
import type { WholesaleBusinessRow } from '../types/wholesaleManagement'
const auth = useAuthStore()
const rows = ref<WholesaleBusinessRow[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const editing = ref<number | null>(null)
const form = reactive({
  storeName: '',
  marketName: '',
  floorRoom: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
})
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
  Object.assign(form, {
    storeName: row.store_name ?? '',
    marketName: row.market_name ?? '',
    floorRoom: row.floor_room ?? '',
    status: row.store_status ?? 'ACTIVE',
  })
}
async function save() {
  if (editing.value == null || !form.storeName.trim()) return
  saving.value = true
  error.value = ''
  try {
    await authorized((token) =>
      wholesaleManagementApi.updateStore(token, editing.value!, {
        storeName: form.storeName.trim(),
        marketName: form.marketName.trim() || null,
        floorRoom: form.floorRoom.trim() || null,
        status: form.status,
      }),
    )
    editing.value = null
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '매장을 저장하지 못했습니다.'
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
        <p>BUSINESS & STORES</p>
        <h1>사업자·매장 관리</h1>
        <span>연결된 도매 사업자와 소유 매장 정보를 확인하고 수정합니다.</span>
      </div>
    </div>
    <form v-if="editing !== null" class="admin-common-form" @submit.prevent="save">
      <div class="admin-common-form-grid">
        <label><span>사업장명</span><input v-model="form.storeName" maxlength="150" required /></label
        ><label><span>시장명</span><input v-model="form.marketName" maxlength="100" /></label
        ><label><span>층·호수</span><input v-model="form.floorRoom" maxlength="50" /></label
        ><label
          ><span>상태</span
          ><select v-model="form.status">
            <option value="ACTIVE">활성</option>
            <option value="INACTIVE">비활성</option>
          </select></label
        >
      </div>
      <div class="admin-common-form-actions">
        <button type="button" @click="editing = null">취소</button
        ><button class="admin-primary-button" :disabled="saving">저장</button>
      </div>
    </form>
    <p v-if="error" class="admin-list-error">{{ error }}</p>
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
              <th>사업자번호</th>
              <th>회사명</th>
              <th>대표자</th>
              <th>승인</th>
              <th>사업장명</th>
              <th>시장·위치</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="admin-empty">정보를 불러오는 중입니다.</td>
            </tr>
            <tr
              v-for="row in rows"
              v-else
              :key="`${row.business_profile_seq}-${row.wholesale_store_seq ?? 0}`"
            >
              <td>{{ row.business_number }}</td>
              <td>{{ row.company_name }}</td>
              <td>{{ row.representative_name }}</td>
              <td>
                <i class="admin-status">{{ row.approval_status }}</i>
              </td>
              <td>{{ row.store_name ?? '연결 매장 없음' }}</td>
              <td>{{ [row.market_name, row.floor_room].filter(Boolean).join(' ') || '-' }}</td>
              <td>{{ row.store_status ?? '-' }}</td>
              <td>
                <button v-if="row.wholesale_store_seq" type="button" @click="edit(row)">수정</button
                ><span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
