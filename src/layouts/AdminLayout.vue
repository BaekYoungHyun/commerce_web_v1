<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)
const loggingOut = ref(false)
const adminRole = computed(() =>
  route.meta.adminRole === 'system'
    ? 'system'
    : route.meta.adminRole === 'seller'
      ? 'seller'
      : 'supplier',
)
const roleLabel = computed(() =>
  adminRole.value === 'system'
    ? '서비스 관리자'
    : adminRole.value === 'supplier'
      ? '도매 관리자'
      : '셀러 관리자',
)
const adminTitle = computed(() => String(route.meta.adminTitle ?? '상품 관리'))
const accountName = computed(() => authStore.user?.name || '로그인 사용자')
const accountId = computed(() => authStore.user?.userId || '')

async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  await authStore.logout().catch(() => undefined)
  await router.replace('/login')
}

type AdminMenu = {
  label: string
  icon: string
  to?: string
  badge?: string
  disabled?: boolean
}

const supplierMenus: AdminMenu[] = [
  { label: '대시보드', icon: '▦', to: '/admin/supplier/dashboard' },
  { label: '상품 관리', icon: '□', to: '/admin/supplier/products' },
  { label: '주문 관리', icon: '▤', to: '/admin/supplier/orders' },
  { label: '입고 관리', icon: '↧', to: '/admin/supplier/stock-receipts' },
  { label: '출고 관리', icon: '⇄', to: '/admin/supplier/shipments' },
  { label: '재고 관리', icon: '▥', to: '/admin/supplier/inventory' },
  { label: '재고 일괄 관리', icon: '≡', to: '/admin/supplier/inventory/bulk' },
  { label: '반품·취소', icon: '↩', disabled: true },
  { label: '정산 관리', icon: '₩', disabled: true },
  { label: '거래처 관리', icon: '♙', disabled: true },
  { label: '문의', icon: '?', to: '/admin/supplier/inquiries' },
  { label: '알림', icon: '!', to: '/admin/supplier/notifications' },
  { label: '사업자·매장 관리', icon: '⌂', disabled: true },
]

const sellerMenus: AdminMenu[] = [
  { label: '대시보드', icon: '▦', to: '/admin/seller/dashboard' },
  { label: '상품 탐색', icon: '□', to: '/admin/seller/products' },
  { label: '장바구니', icon: '▥', to: '/admin/seller/cart' },
  { label: '주문 관리', icon: '▤', to: '/admin/seller/orders' },
  { label: '배송지 관리', icon: '⌂', to: '/admin/seller/addresses' },
  { label: '결제·환불', icon: '₩', to: '/admin/seller/payments' },
  { label: '찜 상품', icon: '♡', to: '/admin/seller/wishlists' },
  { label: '문의', icon: '?', to: '/admin/seller/inquiries' },
  { label: '알림', icon: '!', to: '/admin/seller/notifications' },
  { label: '사업자·매장 관리', icon: '♙', to: '/admin/seller/business' },
]

const systemMenus: AdminMenu[] = [
  { label: '전체 주문', icon: '▥', to: '/admin/orders' },
  { label: '전체 문의', icon: '?', to: '/admin/inquiries' },
  { label: '사용자 관리', icon: '♙', to: '/admin/users' },
  { label: '사업자 프로필', icon: '▤', to: '/admin/business-profiles' },
  { label: '도매 매장', icon: '▦', to: '/admin/wholesale-stores' },
  { label: '소매 매장', icon: '□', to: '/admin/retail-stores' },
  { label: '택배사 관리', icon: '⇄', to: '/admin/delivery-companies' },
]

const menus = computed(() =>
  adminRole.value === 'system'
    ? systemMenus
    : adminRole.value === 'supplier'
      ? supplierMenus
      : sellerMenus,
)
</script>

<template>
  <div class="admin-shell" :class="{ 'menu-open': mobileMenuOpen }">
    <aside class="admin-sidebar">
      <div class="admin-brand-row">
        <RouterLink class="admin-brand" to="/">YH<span>MARKET</span></RouterLink>
        <button type="button" aria-label="관리자 메뉴 닫기" @click="mobileMenuOpen = false">
          ×
        </button>
      </div>
      <div class="admin-role-switch" aria-label="관리자 유형 전환">
        <RouterLink
          v-if="authStore.isWholesale || authStore.isAdmin"
          to="/admin/supplier/products"
          :class="{ active: adminRole === 'supplier' }"
          @click="mobileMenuOpen = false"
          >도매</RouterLink
        >
        <RouterLink
          v-if="authStore.isRetail || authStore.isAdmin"
          to="/admin/seller/orders"
          :class="{ active: adminRole === 'seller' }"
          @click="mobileMenuOpen = false"
          >셀러</RouterLink
        >
        <RouterLink
          v-if="authStore.isAdmin"
          to="/admin/business-profiles"
          :class="{ active: adminRole === 'system' }"
          @click="mobileMenuOpen = false"
          >ADMIN</RouterLink
        >
      </div>
      <p class="admin-menu-label">{{ roleLabel }}</p>
      <nav class="admin-side-nav" aria-label="관리자 메뉴">
        <template v-for="menu in menus" :key="menu.label">
          <RouterLink v-if="menu.to" :to="menu.to" @click="mobileMenuOpen = false">
            <span class="admin-menu-icon">{{ menu.icon }}</span
            >{{ menu.label }}
            <small v-if="menu.badge">{{ menu.badge }}</small>
          </RouterLink>
          <span v-else class="disabled">
            <span class="admin-menu-icon">{{ menu.icon }}</span
            >{{ menu.label }}
            <small v-if="menu.badge">{{ menu.badge }}</small>
          </span>
        </template>
      </nav>
      <div class="admin-sidebar-bottom">
        <RouterLink to="/">← 서비스 화면</RouterLink>
        <span>관리자 메뉴</span>
      </div>
    </aside>

    <section class="admin-workspace">
      <header class="admin-topbar">
        <button
          class="admin-mobile-menu"
          type="button"
          aria-label="관리자 메뉴 열기"
          @click="mobileMenuOpen = true"
        >
          ☰
        </button>
        <div>
          <p>{{ roleLabel }}</p>
          <strong>{{ adminTitle }}</strong>
        </div>
        <div class="admin-account">
          <div class="admin-account-info">
            <span>{{ accountId ? `${accountId} · ${roleLabel}` : roleLabel }}</span>
            <strong>{{ accountName }}</strong>
          </div>
          <button class="admin-logout-button" type="button" :disabled="loggingOut" @click="logout">
            {{ loggingOut ? '로그아웃 중' : '로그아웃' }}
          </button>
        </div>
      </header>
      <RouterView />
    </section>
    <button
      class="admin-overlay"
      type="button"
      aria-label="메뉴 닫기"
      @click="mobileMenuOpen = false"
    ></button>
  </div>
</template>
