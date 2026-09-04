<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminDeliveryCompaniesStore } from '../stores/adminDeliveryCompanies'

const route = useRoute()
const router = useRouter()
const store = useAdminDeliveryCompaniesStore()
const { saving, error, fieldErrors } = storeToRefs(store)
const editCode = computed(() => typeof route.params.code === 'string' ? route.params.code : undefined)
const isEdit = computed(() => editCode.value !== undefined)
const loading = ref(false)
const localError = ref('')
const form = reactive({ code: '', name: '', trackingUrlTemplate: '', active: true })

async function initialize() {
  if (!editCode.value) return
  loading.value = true
  try {
    const items = await store.fetchCompanies()
    const item = items.find((candidate) => candidate.code === editCode.value)
    if (!item) { localError.value = '수정할 택배사를 목록에서 찾을 수 없습니다.'; return }
    Object.assign(form, { ...item, trackingUrlTemplate: item.trackingUrlTemplate ?? '' })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } })
  } finally { loading.value = false }
}

async function submit() {
  localError.value = ''
  const code = form.code.trim()
  const name = form.name.trim()
  if (!code || !name) { localError.value = '코드와 택배사명을 입력해 주세요.'; return }
  if (code.length > 30 || name.length > 100) { localError.value = '코드는 30자, 택배사명은 100자 이내로 입력해 주세요.'; return }
  const common = { name, trackingUrlTemplate: form.trackingUrlTemplate.trim() || null, active: form.active }
  try {
    await store.saveCompany(isEdit.value ? common : { code, ...common }, editCode.value)
    await router.push('/admin/delivery-companies')
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

onMounted(initialize)
</script>

<template>
  <main class="admin-content admin-business-form-content">
    <nav class="admin-breadcrumbs"><RouterLink to="/admin/delivery-companies">택배사 관리</RouterLink><span>›</span><strong>{{ isEdit ? '수정' : '등록' }}</strong></nav>
    <div class="admin-page-heading admin-form-page-heading"><div><p>SERVICE ADMIN</p><h1>택배사 {{ isEdit ? '수정' : '등록' }}</h1><span>출고 완료 시 사용할 택배사 정보를 관리합니다.</span></div></div>
    <form class="admin-form-section admin-business-form" @submit.prevent="submit">
      <div class="admin-form-section-heading"><div><strong>기본 정보</strong><span>등록된 택배사 코드는 변경할 수 없습니다.</span></div></div>
      <p v-if="loading">기존 정보를 불러오는 중입니다.</p>
      <div v-else class="admin-form-grid">
        <label><span>택배사 코드 *</span><input v-model="form.code" required maxlength="30" :readonly="isEdit" /><small>{{ fieldErrors.code }}</small></label>
        <label><span>택배사명 *</span><input v-model="form.name" required maxlength="100" /><small>{{ fieldErrors.name }}</small></label>
        <label><span>배송조회 URL 템플릿</span><input v-model="form.trackingUrlTemplate" placeholder="https://.../{trackingNumber}" /><small>{{ fieldErrors.trackingUrlTemplate }}</small></label>
        <label><span>활성 상태 *</span><select v-model="form.active" required><option :value="true">활성</option><option :value="false">비활성</option></select><small>{{ fieldErrors.active }}</small></label>
      </div>
      <p v-if="localError || error" class="admin-form-error" role="alert">{{ localError || error }}</p>
      <div class="admin-form-footer"><RouterLink to="/admin/delivery-companies">취소</RouterLink><button class="admin-primary-button" type="submit" :disabled="saving || loading">{{ saving ? '저장 중...' : (isEdit ? '수정 저장' : '등록') }}</button></div>
    </form>
  </main>
</template>
