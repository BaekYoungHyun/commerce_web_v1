<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminUsersStore } from '../stores/adminUsers'
import { userStatuses } from '../data/adminStatuses'
import type { BusinessType } from '../types/userType'
import type { AdminUserRole } from '../types/adminUser'

const route = useRoute()
const router = useRouter()
const store = useAdminUsersStore()
const { saving, error, fieldErrors } = storeToRefs(store)
const editSeq = computed(() => route.params.id ? Number(route.params.id) : undefined)
const isEdit = computed(() => editSeq.value !== undefined)
const loading = ref(false)
const localError = ref('')
const businessTypes: Array<{ value: BusinessType; label: string }> = [{ value: 'RETAIL', label: '셀러(소매)' }, { value: 'WHOLESALE', label: '도매' }]
const userRoles: Array<{ value: AdminUserRole; label: string }> = [{ value: 'RETAILER', label: '셀러' }, { value: 'WHOLESALER', label: '도매' }, { value: 'ADMIN', label: '관리자' }]
const form = reactive({ userId: '', passwd: '', phone: '', name: '', status: 'PENDING', businessType: 'RETAIL' as BusinessType, role: 'RETAILER' as AdminUserRole })

async function initialize() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const users = await store.fetchUsers()
    const user = users.find((item) => item.seq === editSeq.value)
    if (!user) { localError.value = '수정할 사용자를 찾을 수 없습니다.'; return }
    Object.assign(form, { userId: user.userId, phone: user.phone, name: user.name, status: user.status, businessType: user.businessType, role: user.role })
  } catch (cause) { if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } }) }
  finally { loading.value = false }
}

async function submit() {
  localError.value = ''
  const common = { userId: form.userId.trim(), phone: form.phone.trim(), name: form.name.trim(), status: form.status.trim(), businessType: form.businessType, role: form.role }
  if (Object.values(common).some((value) => !value) || (!isEdit.value && !form.passwd)) { localError.value = '필수 입력값을 확인해 주세요.'; return }
  const body = isEdit.value ? { ...common, ...(form.passwd ? { passwd: form.passwd } : {}) } : { ...common, passwd: form.passwd }
  try { await store.saveUser(body, editSeq.value); await router.push('/admin/users') }
  catch (cause) { if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } }) }
}
onMounted(initialize)
</script>

<template>
  <main class="admin-content admin-business-form-content"><nav class="admin-breadcrumbs"><RouterLink to="/admin/users">사용자 관리</RouterLink><span>›</span><strong>{{ isEdit ? '수정' : '등록' }}</strong></nav><div class="admin-page-heading admin-form-page-heading"><div><p>ADMIN USER</p><h1>사용자 {{ isEdit ? '수정' : '등록' }}</h1><span>사용자 계정 상태를 선택해 관리합니다.</span></div></div>
    <form class="admin-form-section admin-business-form" @submit.prevent="submit"><div class="admin-form-section-heading"><div><strong>계정 정보</strong><span>수정할 때 비밀번호를 비우면 기존 비밀번호를 유지합니다.</span></div></div><p v-if="loading">사용자 정보를 불러오는 중입니다.</p><div v-else class="admin-form-grid"><label><span>사용자 ID *</span><input v-model="form.userId" maxlength="255" required /><small>{{ fieldErrors.userId }}</small></label><label><span>비밀번호 {{ isEdit ? '(변경 시 입력)' : '*' }}</span><input v-model="form.passwd" maxlength="500" type="password" :required="!isEdit" autocomplete="new-password" /><small>{{ fieldErrors.passwd }}</small></label><label><span>이름 *</span><input v-model="form.name" maxlength="100" required /><small>{{ fieldErrors.name }}</small></label><label><span>연락처 *</span><input v-model="form.phone" maxlength="30" required /><small>{{ fieldErrors.phone }}</small></label><label><span>사업자 유형 *</span><select v-model="form.businessType" required><option v-for="type in businessTypes" :key="type.value" :value="type.value">{{ type.label }} ({{ type.value }})</option></select><small>{{ fieldErrors.businessType }}</small></label><label><span>권한 *</span><select v-model="form.role" required><option v-for="role in userRoles" :key="role.value" :value="role.value">{{ role.label }} ({{ role.value }})</option></select><small>{{ fieldErrors.role }}</small></label><label><span>상태 *</span><select v-model="form.status" required><option v-if="form.status && !userStatuses.some((item) => item.value === form.status)" :value="form.status">{{ form.status }} (기존 값)</option><option v-for="status in userStatuses" :key="status.value" :value="status.value">{{ status.label }} ({{ status.value }})</option></select><small>{{ fieldErrors.status }}</small></label></div><p v-if="localError || error" class="admin-form-error" role="alert">{{ localError || error }}</p><div class="admin-form-footer"><RouterLink to="/admin/users">취소</RouterLink><button class="admin-primary-button" type="submit" :disabled="saving || loading">{{ saving ? '저장 중...' : (isEdit ? '수정 저장' : '등록') }}</button></div></form>
  </main>
</template>
