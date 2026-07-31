<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import type { CartItem } from '../types/cart'

const authStore = useAuthStore()
const cartStore = useCartStore()
const {
  cart,
  cartSeq,
  items,
  loading,
  pendingItemSeqs,
  error,
  allChecked,
  checkedCount,
  productAmount,
} = storeToRefs(cartStore)

const formatPrice = (value: number) => new Intl.NumberFormat('ko-KR').format(value)
const optionName = (item: CartItem) =>
  [item.color, item.size].filter(Boolean).join(' / ') || item.sku
const isSelected = (item: CartItem) => cartStore.checkedItems.some((current) => current.seq === item.seq)

onMounted(() => {
  if (authStore.accessToken && cartSeq.value) cartStore.loadCart().catch(() => undefined)
})
</script>

<template>
  <main class="cart-page">
    <header class="cart-heading">
      <div><p class="eyebrow coral">SHOPPING CART</p><h1>장바구니</h1></div>
      <ol><li class="active">01 장바구니</li><li>02 주문·결제</li><li>03 주문완료</li></ol>
    </header>

    <div v-if="!authStore.accessToken" class="cart-empty">
      <span>Login</span><strong>로그인이 필요합니다.</strong>
      <p>사업자 로그인 후 장바구니를 확인할 수 있습니다.</p>
      <RouterLink :to="{ path: '/login', query: { redirect: '/cart' } }">로그인하기</RouterLink>
    </div>
    <div v-else-if="!cartSeq" class="cart-error">
      <strong>연결된 장바구니가 없습니다.</strong>
      <p>소매 매장의 기본 장바구니가 생성되면 이용할 수 있습니다.</p>
    </div>
    <div v-else-if="loading && !items.length" class="cart-loading">장바구니를 불러오는 중입니다.</div>
    <div v-else-if="error && !items.length" class="cart-error">
      <strong>장바구니를 불러오지 못했습니다.</strong><p>{{ error }}</p>
      <button type="button" @click="cartStore.loadCart(true)">다시 시도</button>
    </div>
    <div v-else-if="!items.length" class="cart-empty">
      <span>Bag</span><strong>장바구니가 비어 있습니다.</strong>
      <p>판매할 상품을 둘러보고 장바구니에 담아보세요.</p>
      <RouterLink to="/">도매 상품 둘러보기</RouterLink>
    </div>

    <div v-else class="cart-layout">
      <section class="cart-list">
        <div class="cart-toolbar">
          <label><input type="checkbox" :checked="allChecked" @change="cartStore.toggleAll" /> 전체 선택</label>
          <button
            type="button"
            :disabled="loading || !cartStore.checkedItems.length"
            @click="cartStore.removeItems(cartStore.checkedItems.map((item) => item.seq))"
          >선택 삭제</button>
        </div>

        <article class="supplier-cart-group">
          <header>
            <div><strong>장바구니 #{{ cart?.cartSeq }}</strong><span>✓ 사업자 전용</span></div>
            <RouterLink to="/">상품 더보기 →</RouterLink>
          </header>
          <div v-for="item in items" :key="item.seq" class="cart-item">
            <input
              type="checkbox"
              :checked="isSelected(item)"
              :aria-label="`${item.productName} 선택`"
              @change="cartStore.toggleItem(item)"
            />
            <RouterLink class="cart-item-image" :to="`/products/${item.productSeq}`">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.productName" />
              <span v-else>NO IMAGE</span>
            </RouterLink>
            <div class="cart-item-info">
              <RouterLink :to="`/products/${item.productSeq}`">{{ item.productName }}</RouterLink>
              <span>옵션: {{ optionName(item) }}</span>
              <small>SKU {{ item.sku }}</small>
            </div>
            <div class="cart-quantity">
              <button
                type="button"
                :disabled="item.quantity <= 1 || pendingItemSeqs.has(item.seq)"
                @click="cartStore.updateQuantity(item, item.quantity - 1)"
              >−</button>
              <strong>{{ item.quantity }}</strong>
              <button
                type="button"
                :disabled="pendingItemSeqs.has(item.seq)"
                @click="cartStore.updateQuantity(item, item.quantity + 1)"
              >＋</button>
            </div>
            <div class="cart-item-price">
              <strong>{{ formatPrice(item.lineAmount) }}원</strong>
              <span>판매가 {{ formatPrice(item.salePrice) }}원</span>
            </div>
            <button
              class="remove-cart-item"
              type="button"
              :disabled="loading"
              :aria-label="`${item.productName} 삭제`"
              @click="cartStore.removeItems([item.seq])"
            >×</button>
          </div>
          <footer>
            <span>전체 {{ cart?.totalQuantity ?? 0 }}개</span>
            <strong>서버 계산 합계 {{ formatPrice(cart?.totalAmount ?? 0) }}원</strong>
          </footer>
        </article>
        <p v-if="error" class="cart-error">{{ error }}</p>
      </section>

      <aside class="cart-summary-panel">
        <h2>선택 상품 금액</h2>
        <dl>
          <div><dt>선택 수량</dt><dd>{{ checkedCount }}개</dd></div>
          <div><dt>상품 금액</dt><dd>{{ formatPrice(productAmount) }}원</dd></div>
        </dl>
        <div class="cart-total">
          <span>선택 상품 합계</span><strong>{{ formatPrice(productAmount) }}원</strong>
          <small>서버가 확정한 품목별 금액 기준</small>
        </div>
        <button class="checkout-button" type="button" disabled>주문 API 준비 중</button>
        <p>배송비와 최종 결제 금액은 주문 단계에서 서버가 확정합니다.</p>
      </aside>
    </div>
  </main>
</template>
