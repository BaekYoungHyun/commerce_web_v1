<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminBusinessesStore } from '../stores/adminBusinesses'
import { useAdminUsersStore } from '../stores/adminUsers'
import { approvalStatuses, storeStatuses } from '../data/adminStatuses'
import type { AdminBusinessRequest, AdminBusinessResource, BusinessProfile, RetailStore, WholesaleStore } from '../types/adminBusiness'
import { formatDateTime } from '../utils/dateTime'

const route = useRoute()
const router = useRouter()
const store = useAdminBusinessesStore()
const usersStore = useAdminUsersStore()
const { users: adminUsers, loading: usersLoading, error: usersError } = storeToRefs(usersStore)
const { saving, error, fieldErrors } = storeToRefs(store)
const resource = computed(() => route.meta.businessResource as AdminBusinessResource)
const editSeq = computed(() => route.params.id ? Number(route.params.id) : undefined)
const isEdit = computed(() => editSeq.value !== undefined)
const loading = ref(false)
const localError = ref('')
const userPickerOpen = ref(false)
const profilePickerOpen = ref(false)
const profileLoading = ref(false)
const userKeyword = ref('')
const profileKeyword = ref('')
const selectedUser = reactive({ userId: '', userName: '' })
const selectedProfile = reactive({ businessNumber: '', companyName: '', representativeName: '' })
const businessProfiles = ref<BusinessProfile[]>([])
const filteredUsers = computed(() => {
  const query = userKeyword.value.trim().toLowerCase()
  if (!query) return adminUsers.value
  return adminUsers.value.filter((user) => [user.seq, user.userId, user.name, user.phone, user.status].some((value) => String(value).toLowerCase().includes(query)))
})
const filteredProfiles = computed(() => {
  const query = profileKeyword.value.trim().toLowerCase()
  if (!query) return businessProfiles.value
  return businessProfiles.value.filter((profile) => [profile.seq, profile.businessNumber, profile.companyName, profile.representativeName, profile.approvalStatus, profile.userId, profile.userName].some((value) => String(value ?? '').toLowerCase().includes(query)))
})
const config = computed(() => ({
  'business-profiles': { title: '사업자 프로필', list: '/admin/business-profiles' },
  'wholesale-stores': { title: '도매 매장', list: '/admin/wholesale-stores' },
  'retail-stores': { title: '소매 매장', list: '/admin/retail-stores' },
})[resource.value])
const form = reactive({ userSeq: '', businessNumber: '', companyName: '', representativeName: '', approvalStatus: 'PENDING', approvedAt: '', businessProfileSeq: '', storeName: '', marketName: '', floorRoom: '', salesChannel: '', status: 'ACTIVE' })

function nowLocalDateTime() {
  const now = new Date()
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 19)
}

function hydrate(item: BusinessProfile | WholesaleStore | RetailStore) {
  if ('approvalStatus' in item) {
    Object.assign(form, { userSeq: String(item.userSeq), businessNumber: item.businessNumber, companyName: item.companyName, representativeName: item.representativeName, approvalStatus: item.approvalStatus, approvedAt: item.approvedAt ?? '' })
    Object.assign(selectedUser, { userId: item.userId ?? '', userName: item.userName })
  }
  else if ('marketName' in item) {
    Object.assign(form, { businessProfileSeq: String(item.businessProfileSeq), storeName: item.storeName, marketName: item.marketName ?? '', floorRoom: item.floorRoom ?? '', status: item.status })
    Object.assign(selectedProfile, { businessNumber: item.businessNumber, companyName: item.companyName })
  } else {
    Object.assign(form, { businessProfileSeq: String(item.businessProfileSeq), storeName: item.storeName, salesChannel: item.salesChannel ?? '', status: item.status })
    Object.assign(selectedProfile, { businessNumber: item.businessNumber, companyName: item.companyName })
  }
}

async function initialize() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const items = await store.fetchItems(resource.value)
    const item = items.find((candidate) => candidate.seq === editSeq.value)
    if (!item) { localError.value = '수정할 정보를 목록에서 찾을 수 없습니다.'; return }
    hydrate(item as BusinessProfile | WholesaleStore | RetailStore)
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } })
  } finally { loading.value = false }
}

async function openUserPicker() {
  userKeyword.value = ''
  userPickerOpen.value = true
  try { await usersStore.fetchUsers() }
  catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

function chooseUser(user: (typeof adminUsers.value)[number]) {
  form.userSeq = String(user.seq)
  Object.assign(selectedUser, { userId: user.userId, userName: user.name })
  userPickerOpen.value = false
}

async function openProfilePicker() {
  profileKeyword.value = ''
  profilePickerOpen.value = true
  profileLoading.value = true
  try {
    businessProfiles.value = (await store.fetchItems('business-profiles')) as BusinessProfile[]
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } })
  } finally {
    profileLoading.value = false
  }
}

function chooseProfile(profile: BusinessProfile) {
  form.businessProfileSeq = String(profile.seq)
  Object.assign(selectedProfile, { businessNumber: profile.businessNumber, companyName: profile.companyName, representativeName: profile.representativeName })
  profilePickerOpen.value = false
}

function payload(): AdminBusinessRequest {
  if (resource.value === 'business-profiles') return { userSeq: Number(form.userSeq), businessNumber: form.businessNumber.trim(), companyName: form.companyName.trim(), representativeName: form.representativeName.trim(), approvalStatus: form.approvalStatus.trim(), approvedAt: form.approvedAt || null }
  if (resource.value === 'wholesale-stores') return { businessProfileSeq: Number(form.businessProfileSeq), storeName: form.storeName.trim(), marketName: form.marketName.trim() || null, floorRoom: form.floorRoom.trim() || null, status: form.status.trim() }
  return { businessProfileSeq: Number(form.businessProfileSeq), storeName: form.storeName.trim(), salesChannel: form.salesChannel.trim() || null, status: form.status.trim() }
}

async function submit() {
  localError.value = ''
  const body = payload()
  if (Object.entries(body).some(([key, value]) => key !== 'approvedAt' && value !== null && (value === '' || (typeof value === 'number' && (!Number.isInteger(value) || value < 1))))) { localError.value = '필수 입력값과 ID를 확인해 주세요.'; return }
  try { await store.save(resource.value, body, editSeq.value); await router.push(config.value.list) }
  catch (cause) { if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } }) }
}

onMounted(initialize)
watch(() => form.approvalStatus, (status, previousStatus) => {
  if (status === 'APPROVED' && previousStatus !== 'APPROVED' && !form.approvedAt) form.approvedAt = nowLocalDateTime()
  if (status !== 'APPROVED') form.approvedAt = ''
})
</script>

<template>
  <main class="admin-content admin-business-form-content">
    <nav class="admin-breadcrumbs"><RouterLink :to="config.list">{{ config.title }} 관리</RouterLink><span>›</span><strong>{{ isEdit ? '수정' : '등록' }}</strong></nav>
    <div class="admin-page-heading admin-form-page-heading"><div><p>SERVICE ADMIN</p><h1>{{ config.title }} {{ isEdit ? '수정' : '등록' }}</h1><span>{{ resource === 'business-profiles' ? '대표 사용자를 선택하고 사업자 승인 상태를 관리합니다.' : '매장 운영 상태를 선택해 관리합니다.' }}</span></div></div>
    <form class="admin-form-section admin-business-form" @submit.prevent="submit">
      <div class="admin-form-section-heading"><div><strong>기본 정보</strong><span>별표 항목은 필수입니다. nullable 항목은 비워두면 null로 전송합니다.</span></div></div>
      <p v-if="loading">기존 정보를 불러오는 중입니다.</p>
      <div v-else class="admin-form-grid">
        <template v-if="resource === 'business-profiles'">
          <label class="admin-user-picker-field"><span>대표 사용자 *</span><button type="button" class="admin-user-picker-button" @click="openUserPicker"><strong v-if="form.userSeq">SEQ {{ form.userSeq }}</strong><span v-if="selectedUser.userName">{{ selectedUser.userName }}<small v-if="selectedUser.userId">({{ selectedUser.userId }})</small></span><span v-else>{{ form.userSeq ? '선택된 사용자' : '대표 사용자 선택' }}</span><b>검색</b></button><small>{{ fieldErrors.userSeq }}</small></label>
          <label><span>사업자번호 *</span><input v-model="form.businessNumber" required /><small>{{ fieldErrors.businessNumber }}</small></label>
          <label><span>상호 *</span><input v-model="form.companyName" required /><small>{{ fieldErrors.companyName }}</small></label>
          <label><span>대표자명 *</span><input v-model="form.representativeName" required /><small>{{ fieldErrors.representativeName }}</small></label>
          <label><span>승인 상태 *</span><select v-model="form.approvalStatus" required><option v-for="status in approvalStatuses" :key="status.value" :value="status.value">{{ status.label }} ({{ status.value }})</option></select><small>{{ fieldErrors.approvalStatus }}</small></label>
          <label><span>승인 일시</span><input :value="form.approvedAt ? formatDateTime(form.approvedAt) : '승인 상태 선택 시 자동 등록'" readonly /><small>{{ fieldErrors.approvedAt }}</small></label>
        </template>
        <template v-else>
          <label class="admin-user-picker-field"><span>사업자 프로필 *</span><button type="button" class="admin-user-picker-button" @click="openProfilePicker"><strong v-if="form.businessProfileSeq">SEQ {{ form.businessProfileSeq }}</strong><span v-if="selectedProfile.companyName">{{ selectedProfile.companyName }}<small v-if="selectedProfile.businessNumber">({{ selectedProfile.businessNumber }})</small></span><span v-else>{{ form.businessProfileSeq ? '선택된 사업자 프로필' : '사업자 프로필 선택' }}</span><b>검색</b></button><small>{{ fieldErrors.businessProfileSeq }}</small></label>
          <label><span>매장명 *</span><input v-model="form.storeName" required /><small>{{ fieldErrors.storeName }}</small></label>
          <label v-if="resource === 'wholesale-stores'"><span>시장명</span><input v-model="form.marketName" /><small>{{ fieldErrors.marketName }}</small></label>
          <label v-if="resource === 'wholesale-stores'"><span>층/호수</span><input v-model="form.floorRoom" /><small>{{ fieldErrors.floorRoom }}</small></label>
          <label v-if="resource === 'retail-stores'"><span>판매 채널</span><input v-model="form.salesChannel" /><small>{{ fieldErrors.salesChannel }}</small></label>
          <label><span>상태 *</span><select v-model="form.status" required><option v-if="form.status && !storeStatuses.some((item) => item.value === form.status)" :value="form.status">{{ form.status }} (기존 값)</option><option v-for="status in storeStatuses" :key="status.value" :value="status.value">{{ status.label }} ({{ status.value }})</option></select><small>{{ fieldErrors.status }}</small></label>
        </template>
      </div>
      <p v-if="localError || error" class="admin-form-error" role="alert">{{ localError || error }}</p>
      <div class="admin-form-footer"><RouterLink :to="config.list">취소</RouterLink><button class="admin-primary-button" type="submit" :disabled="saving || loading">{{ saving ? '저장 중...' : (isEdit ? '수정 저장' : '등록') }}</button></div>
    </form>
    <div v-if="userPickerOpen" class="admin-modal-backdrop" role="presentation" @click.self="userPickerOpen = false">
      <section class="admin-product-modal admin-user-picker-modal" role="dialog" aria-modal="true" aria-labelledby="user-picker-title">
        <div class="admin-modal-heading"><div><p>REPRESENTATIVE USER</p><h2 id="user-picker-title">대표 사용자 선택</h2></div><button type="button" aria-label="팝업 닫기" @click="userPickerOpen = false">×</button></div>
        <p class="admin-picker-guide">사용자 목록에서 대표자로 연결할 계정을 선택하세요.</p>
        <label class="admin-picker-search"><span>사용자 검색</span><input v-model="userKeyword" placeholder="SEQ, 아이디, 이름, 연락처, 상태" /></label>
        <p v-if="usersError" class="admin-list-error" role="alert">{{ usersError }} <button type="button" @click="usersStore.fetchUsers()">다시 시도</button></p>
        <div class="admin-user-picker-list">
          <p v-if="usersLoading">사용자 목록을 불러오는 중입니다.</p>
          <button v-for="user in filteredUsers" v-else :key="user.seq" type="button" :class="{ selected: Number(form.userSeq) === user.seq }" @click="chooseUser(user)"><span><strong>{{ user.name }}</strong><small>{{ user.userId }} · {{ user.phone }}</small></span><span><i>{{ user.status }}</i><b>SEQ {{ user.seq }}</b></span></button>
          <p v-if="!usersLoading && filteredUsers.length === 0">조건에 맞는 사용자가 없습니다.</p>
        </div>
      </section>
    </div>
    <div v-if="profilePickerOpen" class="admin-modal-backdrop" role="presentation" @click.self="profilePickerOpen = false">
      <section class="admin-product-modal admin-user-picker-modal" role="dialog" aria-modal="true" aria-labelledby="profile-picker-title">
        <div class="admin-modal-heading"><div><p>BUSINESS PROFILE</p><h2 id="profile-picker-title">사업자 프로필 선택</h2></div><button type="button" aria-label="팝업 닫기" @click="profilePickerOpen = false">×</button></div>
        <p class="admin-picker-guide">매장과 연결할 사업자 프로필을 선택하세요.</p>
        <label class="admin-picker-search"><span>사업자 프로필 검색</span><input v-model="profileKeyword" placeholder="SEQ, 사업자번호, 상호, 대표자, 사용자, 승인 상태" /></label>
        <p v-if="error" class="admin-list-error" role="alert">{{ error }} <button type="button" @click="openProfilePicker">다시 시도</button></p>
        <div class="admin-user-picker-list admin-profile-picker-list">
          <p v-if="profileLoading">사업자 프로필 목록을 불러오는 중입니다.</p>
          <button v-for="profile in filteredProfiles" v-else :key="profile.seq" type="button" :class="{ selected: Number(form.businessProfileSeq) === profile.seq }" @click="chooseProfile(profile)"><span><strong>{{ profile.companyName }}</strong><small>{{ profile.businessNumber }} · 대표 {{ profile.representativeName }}</small><small>{{ profile.userName }}<template v-if="profile.userId"> ({{ profile.userId }})</template></small></span><span><i>{{ profile.approvalStatus }}</i><b>SEQ {{ profile.seq }}</b></span></button>
          <p v-if="!profileLoading && filteredProfiles.length === 0">조건에 맞는 사업자 프로필이 없습니다.</p>
        </div>
      </section>
    </div>
  </main>
</template>
