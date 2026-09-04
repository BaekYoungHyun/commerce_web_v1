<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ApiError } from '../services/httpClient'
import type { BusinessType } from '../types/userType'

type FieldErrors = Partial<Record<'userId' | 'passwd' | 'phone' | 'name' | 'businessType', string>>

const router = useRouter()
const authStore = useAuthStore()
const form = reactive({ userId: '', passwd: '', phone: '', name: '', businessType: 'RETAIL' as BusinessType })
const fieldErrors = reactive<FieldErrors>({})
const errorMessage = ref('')
const successMessage = ref('')

function validate() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key as keyof FieldErrors])
  errorMessage.value = ''

  const userId = form.userId.trim()
  const phone = form.phone.trim()
  const name = form.name.trim()
  if (!userId) fieldErrors.userId = '아이디를 입력해 주세요.'
  else if (userId.length > 255) fieldErrors.userId = '아이디는 255자 이하여야 합니다.'
  if (!form.passwd.trim()) fieldErrors.passwd = '비밀번호를 입력해 주세요.'
  else if (form.passwd.length > 500) fieldErrors.passwd = '비밀번호는 500자 이하여야 합니다.'
  if (!phone) fieldErrors.phone = '휴대폰 번호를 입력해 주세요.'
  else if (phone.length > 30) fieldErrors.phone = '휴대폰 번호는 30자 이하여야 합니다.'
  if (!name) fieldErrors.name = '이름을 입력해 주세요.'
  else if (name.length > 100) fieldErrors.name = '이름은 100자 이하여야 합니다.'

  return Object.keys(fieldErrors).length === 0
}

async function submit() {
  successMessage.value = ''
  if (!validate()) return

  try {
    await authStore.signUp({
      userId: form.userId.trim(),
      passwd: form.passwd,
      phone: form.phone.trim(),
      name: form.name.trim(),
      businessType: form.businessType,
    })
    successMessage.value = '회원가입이 완료되었습니다. 로그인해 주세요.'
    window.setTimeout(() => router.push('/login'), 800)
  } catch (cause) {
    if (cause instanceof ApiError && cause.code === 'DUPLICATE_USER') {
      fieldErrors.userId = '이미 가입된 아이디입니다.'
      return
    }
    if (
      cause instanceof ApiError &&
      (cause.code === 'INVALID_VALUE_REQUEST' || cause.code === 'REQUIRED_DATA_NOT_FOUND')
    ) {
      errorMessage.value = cause.message
      return
    }
    errorMessage.value = cause instanceof Error ? cause.message : '회원가입에 실패했습니다.'
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <div class="auth-intro">
        <p class="eyebrow coral">BUSINESS MEMBERSHIP</p>
        <h1>신뢰할 수 있는 거래의<br />첫걸음을 시작하세요.</h1>
        <p>가입 후 회원 상태와 사업자 인증 정책에 따라 서비스 이용 범위가 결정됩니다.</p>
      </div>
      <form class="auth-form signup-form" @submit.prevent="submit">
        <h2>사업자 회원가입</h2>
        <label
          >사업자 유형
          <select v-model="form.businessType" required>
            <option value="RETAIL">셀러(소매)</option>
            <option value="WHOLESALE">도매</option>
          </select>
        </label>
        <label
          >아이디
          <input
            v-model="form.userId"
            required
            maxlength="255"
            autocomplete="username"
            :aria-invalid="Boolean(fieldErrors.userId)"
            placeholder="사용할 아이디"
          />
          <span v-if="fieldErrors.userId" class="field-error">{{ fieldErrors.userId }}</span>
        </label>
        <label
          >비밀번호
          <input
            v-model="form.passwd"
            required
            maxlength="500"
            type="password"
            autocomplete="new-password"
            :aria-invalid="Boolean(fieldErrors.passwd)"
            placeholder="비밀번호"
          />
          <span v-if="fieldErrors.passwd" class="field-error">{{ fieldErrors.passwd }}</span>
        </label>
        <label
          >이름
          <input
            v-model="form.name"
            required
            maxlength="100"
            autocomplete="name"
            :aria-invalid="Boolean(fieldErrors.name)"
            placeholder="담당자 이름"
          />
          <span v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</span>
        </label>
        <label
          >휴대폰 번호
          <input
            v-model="form.phone"
            required
            maxlength="30"
            type="tel"
            autocomplete="tel"
            :aria-invalid="Boolean(fieldErrors.phone)"
            placeholder="01012345678"
          />
          <span v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</span>
        </label>
        <button class="submit-button" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? '가입 처리 중...' : '회원가입' }}
        </button>
        <p v-if="errorMessage" class="form-notice" role="alert">{{ errorMessage }}</p>
        <p v-if="successMessage" class="form-success" role="status">{{ successMessage }}</p>
        <div class="auth-links"><RouterLink to="/login">이미 회원이신가요? 로그인</RouterLink></div>
      </form>
    </section>
  </main>
</template>
