<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'
import { useCategoriesStore } from './stores/categories'

const menuOpen = ref(false)
const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const isAdminLayout = computed(() => route.meta.layout === 'admin')

onMounted(() => {
  if (authStore.accessToken && cartStore.cartSeq) cartStore.loadCart().catch(() => undefined)
})

watch(
  () => authStore.accessToken,
  (accessToken) => {
    if (accessToken) {
      categoriesStore.fetchCategories().catch(() => undefined)
      if (cartStore.cartSeq) cartStore.loadCart().catch(() => undefined)
    } else cartStore.clearCart()
  },
  { immediate: true },
)

async function logout() {
  await authStore.logout().catch(() => undefined)
  await router.push('/login')
}
</script>

<template>
  <div class="page-shell">
    <div v-if="!isAdminLayout" class="notice-bar">
      <p><strong>사업자 회원 전용</strong> 첫 거래 무료배송 · 안전결제 지원</p>
    </div>

    <header v-if="!isAdminLayout" class="header">
      <div class="header-inner">
        <RouterLink class="brand" to="/" aria-label="YH마켓 비즈니스 홈">
          <span>YH</span>MARKET <small>BUSINESS</small>
        </RouterLink>
        <nav class="main-nav" :class="{ open: menuOpen }" aria-label="주요 메뉴">
          <RouterLink to="/">도매 상품</RouterLink>
          <a href="/#new">신상품</a>
          <a href="/#benefits">거래 혜택</a>
          <RouterLink to="/admin/supplier/products">관리자</RouterLink>
        </nav>
        <div class="header-actions">
          <RouterLink class="supplier-link" to="/admin/supplier/products">관리자 센터</RouterLink>
          <RouterLink class="header-cart" to="/cart" aria-label="장바구니">
            장바구니 <span v-if="cartStore.itemCount">{{ cartStore.itemCount }}</span>
          </RouterLink>
          <button v-if="authStore.isAuthenticated" class="login-button" type="button" @click="logout">
            로그아웃
          </button>
          <RouterLink v-else class="login-button" to="/login">로그인</RouterLink>
          <button class="menu-button" aria-label="메뉴 열기" @click="menuOpen = !menuOpen">☰</button>
        </div>
      </div>
      <div class="header-category-area">
        <nav v-if="authStore.accessToken && categoriesStore.categories.length" class="header-category-primary" aria-label="1뎁스 상품 카테고리">
          <RouterLink to="/categories">전체</RouterLink><RouterLink v-for="category in categoriesStore.categories" :key="category.seq" :to="{ path: `/categories/${encodeURIComponent(category.name)}`, query: { categorySeq: category.seq } }">{{ category.name }}</RouterLink>
        </nav>
        <div v-else class="header-category-status"><span v-if="categoriesStore.loading">카테고리를 불러오는 중...</span><span v-else-if="categoriesStore.error">카테고리를 불러오지 못했습니다.</span><RouterLink v-else to="/login">로그인 후 전체 카테고리 보기 →</RouterLink></div>
      </div>
    </header>

    <RouterView />

    <footer v-if="!isAdminLayout">
      <RouterLink class="brand footer-brand" to="/"><span>YH</span>MARKET</RouterLink>
      <p>도매와 셀러의 성장을 연결하는 B2B 패션 마켓</p>
      <div><a href="#">이용약관</a><a href="#">개인정보처리방침</a><a href="#">사업자 고객센터</a></div>
      <small>© 2026 YH MARKET BUSINESS. All rights reserved.</small>
    </footer>
  </div>
</template>
