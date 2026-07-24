<script setup lang="ts">
import { ref } from 'vue'

const role = ref<'seller' | 'supplier'>('seller')
const submitted = ref(false)
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <div class="auth-intro">
        <p class="eyebrow coral">BUSINESS SIGN IN</p>
        <h1>사업의 다음 성장을<br />YH마켓과 함께하세요.</h1>
        <p>사업자 인증 회원만 이용할 수 있는 안전한 B2B 거래 공간입니다.</p>
      </div>
      <form class="auth-form" @submit.prevent="submitted = true">
        <h2>로그인</h2>
        <div class="role-tabs" aria-label="회원 유형">
          <button type="button" :class="{ active: role === 'seller' }" @click="role = 'seller'">셀러 회원</button>
          <button type="button" :class="{ active: role === 'supplier' }" @click="role = 'supplier'">도매 회원</button>
        </div>
        <label>이메일<input required type="email" placeholder="business@example.com" /></label>
        <label>비밀번호<input required type="password" placeholder="비밀번호를 입력하세요" /></label>
        <button class="submit-button" type="submit">{{ role === 'seller' ? '셀러로 로그인' : '도매로 로그인' }}</button>
        <p v-if="submitted" class="form-notice">현재는 화면 데모입니다. API 연결 후 로그인이 처리됩니다.</p>
        <div class="auth-links"><a href="#">아이디 찾기</a><a href="#">비밀번호 찾기</a><a href="#">사업자 회원가입</a></div>
      </form>
    </section>
  </main>
</template>
