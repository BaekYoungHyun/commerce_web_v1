<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ApiError } from '../services/httpClient'

const REMEMBERED_USER_ID_KEY = 'commerce.rememberedUserId'
const rememberedUserId = typeof localStorage === 'undefined'
  ? ''
  : localStorage.getItem(REMEMBERED_USER_ID_KEY) ?? ''
const router = useRouter()
const authStore = useAuthStore()
const form = reactive({ userId: rememberedUserId, passwd: '' })
const rememberUserId = ref(Boolean(rememberedUserId))
const errorMessage = ref('')

function updateRememberedUserId(userId: string) {
  if (typeof localStorage === 'undefined') return
  if (rememberUserId.value) localStorage.setItem(REMEMBERED_USER_ID_KEY, userId)
  else localStorage.removeItem(REMEMBERED_USER_ID_KEY)
}

function handleRememberChange() {
  if (!rememberUserId.value && typeof localStorage !== 'undefined') {
    localStorage.removeItem(REMEMBERED_USER_ID_KEY)
  }
}

async function submit() {
  errorMessage.value = ''
  if (!form.userId.trim() || !form.passwd) {
    errorMessage.value = '아이디와 비밀번호를 모두 입력해 주세요.'
    return
  }

  try {
    const userId = form.userId.trim()
    await authStore.login({ userId, passwd: form.passwd })
    await authStore.fetchCurrentUser()
    updateRememberedUserId(userId)
    await router.push(authStore.defaultLandingPath)
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 403) {
      errorMessage.value =
        cause.code === 2000
          ? '가입되지 않은 아이디입니다.'
          : cause.code === 2047
            ? '비밀번호가 정확하지 않습니다.'
            : cause.code === 2048
              ? '현재 로그인할 수 없는 회원 상태입니다.'
              : cause.message
      return
    }
    errorMessage.value = cause instanceof Error ? cause.message : '로그인에 실패했습니다.'
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <div class="auth-intro">
        <p class="eyebrow coral">BUSINESS SIGN IN</p>
        <h1>사업의 다음 성장을<br />YH마켓과 함께하세요.</h1>
        <p>사업자 인증 회원만 이용할 수 있는 안전한 B2B 거래 공간입니다.</p>
      </div>
      <form class="auth-form" @submit.prevent="submit">
        <h2>로그인</h2>
        <label
          >아이디
          <input
            v-model="form.userId"
            required
            maxlength="255"
            autocomplete="username"
            placeholder="사업자 회원 아이디"
          />
        </label>
        <label
          >비밀번호
          <input
            v-model="form.passwd"
            required
            maxlength="500"
            type="password"
            autocomplete="current-password"
            placeholder="비밀번호를 입력하세요"
          />
        </label>
        <label class="remember-user-id">
          <input v-model="rememberUserId" type="checkbox" @change="handleRememberChange" />
          <span>아이디 기억하기</span>
        </label>
        <button class="submit-button" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? '로그인 중...' : '로그인' }}
        </button>
        <p v-if="errorMessage" class="form-notice" role="alert">{{ errorMessage }}</p>
        <div class="auth-links">
          <a href="#">아이디 찾기</a><a href="#">비밀번호 찾기</a
          ><RouterLink to="/signup">사업자 회원가입</RouterLink>
        </div>
      </form>
    </section>
  </main>
</template>
