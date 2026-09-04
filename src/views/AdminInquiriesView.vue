<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminCommonStore } from '../stores/adminCommon'

const route = useRoute()
const router = useRouter()
const store = useAdminCommonStore()
const { inquiries, loading, saving, error, fieldErrors } = storeToRefs(store)
const roleLabel = computed(() => (route.meta.adminRole === 'supplier' ? '도매' : '셀러'))
const formOpen = ref(false)
const form = reactive({ category: '', title: '', content: '' })
const validationError = ref('')

const statusLabel = (status: string) =>
  ({ OPEN: '접수', ANSWERED: '답변 완료', CLOSED: '종료' })[status] ?? status

async function load() {
  try {
    await store.fetchInquiries()
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

async function submit() {
  const body = {
    category: form.category.trim(),
    title: form.title.trim(),
    content: form.content.trim(),
  }
  if (!body.category || !body.title || !body.content) {
    validationError.value = '문의 유형, 제목, 내용을 모두 입력해주세요.'
    return
  }
  if (body.category.length > 50 || body.title.length > 200) {
    validationError.value = '문의 유형은 50자, 제목은 200자 이내로 입력해주세요.'
    return
  }
  validationError.value = ''
  try {
    await store.createInquiry(body)
    Object.assign(form, { category: '', title: '', content: '' })
    formOpen.value = false
  } catch {
    // 스토어 오류 영역에서 서버 메시지와 필드 오류를 표시한다.
  }
}

onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>SUPPORT CENTER</p>
        <h1>문의 관리</h1>
        <span>{{ roleLabel }} 관리자 계정으로 등록한 문의를 확인합니다.</span>
      </div>
      <button class="admin-primary-button" type="button" @click="formOpen = !formOpen">
        + 문의 등록
      </button>
    </div>
    <form v-if="formOpen" class="admin-common-form" @submit.prevent="submit">
      <div class="admin-common-form-grid">
        <label
          ><span>문의 유형</span
          ><input
            v-model="form.category"
            maxlength="50"
            placeholder="예: 주문, 상품, 배송"
          /><small>{{ fieldErrors.category }}</small></label
        >
        <label
          ><span>제목</span
          ><input v-model="form.title" maxlength="200" placeholder="문의 제목" /><small>{{
            fieldErrors.title
          }}</small></label
        >
      </div>
      <label
        ><span>문의 내용</span
        ><textarea
          v-model="form.content"
          rows="6"
          placeholder="문의 내용을 입력해주세요."
        /><small>{{ fieldErrors.content }}</small></label
      >
      <p v-if="validationError" class="admin-list-error" role="alert">{{ validationError }}</p>
      <div class="admin-common-form-actions">
        <button type="button" @click="formOpen = false">취소</button
        ><button class="admin-primary-button" type="submit" :disabled="saving">
          {{ saving ? '등록 중' : '문의 등록' }}
        </button>
      </div>
    </form>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>내 문의</h2>
          <span>총 {{ inquiries.length }}건</span>
        </div>
      </div>
      <div v-if="loading" class="admin-common-state">문의 목록을 불러오는 중입니다.</div>
      <div v-else-if="inquiries.length" class="admin-common-list">
        <article v-for="inquiry in inquiries" :key="inquiry.seq">
          <header>
            <div>
              <span>{{ inquiry.category }}</span>
              <h3>{{ inquiry.title }}</h3>
            </div>
            <i class="admin-status">{{ statusLabel(inquiry.status) }}</i>
          </header>
          <p>{{ inquiry.content }}</p>
        </article>
      </div>
      <div v-else class="admin-common-state">등록한 문의가 없습니다.</div>
    </section>
  </main>
</template>
