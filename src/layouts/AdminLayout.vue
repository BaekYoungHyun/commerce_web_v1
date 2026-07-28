<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const mobileMenuOpen = ref(false)
const adminRole = computed(() => (route.meta.adminRole === 'seller' ? 'seller' : 'supplier'))
const roleLabel = computed(() => (adminRole.value === 'supplier' ? '도매 관리자' : '셀러 관리자'))
const adminTitle = computed(() => String(route.meta.adminTitle ?? '상품 관리'))

type AdminMenu = {
  label: string
  icon: string
  to?: string
  badge?: string
  disabled?: boolean
}

const supplierMenus: AdminMenu[] = [
  { label: '대시보드', icon: '▦', disabled: true },
  { label: '상품 관리', icon: '□', to: '/admin/supplier/products' },
  { label: '주문 관리', icon: '▤', badge: '24', disabled: true },
  { label: '입·출고 관리', icon: '⇄', disabled: true },
  { label: '재고 관리', icon: '▥', disabled: true },
  { label: '매출 관리', icon: '↗', disabled: true },
  { label: '정산 관리', icon: '₩', disabled: true },
]

const sellerMenus: AdminMenu[] = [
  { label: '대시보드', icon: '▦', disabled: true },
  { label: '상품 관리', icon: '□', to: '/admin/seller/products' },
  { label: '구매 관리', icon: '▤', disabled: true },
  { label: '판매 관리', icon: '↗', disabled: true },
  { label: '재고 관리', icon: '▥', disabled: true },
  { label: '정산 관리', icon: '₩', disabled: true },
]

const menus = computed(() => (adminRole.value === 'supplier' ? supplierMenus : sellerMenus))
</script>

<template>
  <div class="admin-shell" :class="{ 'menu-open': mobileMenuOpen }">
    <aside class="admin-sidebar">
      <div class="admin-brand-row">
        <RouterLink class="admin-brand" to="/">YH<span>MARKET</span></RouterLink>
        <button type="button" aria-label="관리자 메뉴 닫기" @click="mobileMenuOpen = false">×</button>
      </div>
      <div class="admin-role-switch" aria-label="관리자 유형 전환">
        <RouterLink
          to="/admin/supplier/products"
          :class="{ active: adminRole === 'supplier' }"
          @click="mobileMenuOpen = false"
          >도매</RouterLink
        >
        <RouterLink
          to="/admin/seller/products"
          :class="{ active: adminRole === 'seller' }"
          @click="mobileMenuOpen = false"
          >셀러</RouterLink
        >
      </div>
      <p class="admin-menu-label">{{ roleLabel }}</p>
      <nav class="admin-side-nav" aria-label="관리자 메뉴">
        <template v-for="menu in menus" :key="menu.label">
          <RouterLink v-if="menu.to" :to="menu.to" @click="mobileMenuOpen = false">
            <span class="admin-menu-icon">{{ menu.icon }}</span>{{ menu.label }}
            <small v-if="menu.badge">{{ menu.badge }}</small>
          </RouterLink>
          <span v-else class="disabled">
            <span class="admin-menu-icon">{{ menu.icon }}</span>{{ menu.label }}
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
        <button class="admin-mobile-menu" type="button" aria-label="관리자 메뉴 열기" @click="mobileMenuOpen = true">
          ☰
        </button>
        <div>
          <p>{{ roleLabel }}</p>
          <strong>{{ adminTitle }}</strong>
        </div>
        <div class="admin-account">
          <span>{{ adminRole === 'supplier' ? '모먼트어패럴' : '성장셀러 스토어' }}</span>
          <strong>{{ adminRole === 'supplier' ? '도매 담당자' : '셀러 담당자' }}</strong>
          <i>⌄</i>
        </div>
      </header>
      <RouterView />
    </section>
    <button class="admin-overlay" type="button" aria-label="메뉴 닫기" @click="mobileMenuOpen = false"></button>
  </div>
</template>
