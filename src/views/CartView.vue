<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useCartStore } from '../stores/cart'
import type { CartItem } from '../types/cart'

const cartStore = useCartStore()
const { items, loading, error, allChecked, checkedCount, productAmount, shippingAmount, totalAmount } =
  storeToRefs(cartStore)

const supplierGroups = computed(() => {
  const groups = new Map<number, { supplierId: number; supplierName: string; items: CartItem[] }>()
  for (const item of items.value) {
    const group = groups.get(item.supplierId) ?? {
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      items: [],
    }
    group.items.push(item)
    groups.set(item.supplierId, group)
  }
  return [...groups.values()]
})

const formatPrice = (value: number) => new Intl.NumberFormat('ko-KR').format(value)
const supplierAmount = (supplierItems: CartItem[]) =>
  supplierItems.filter((item) => item.checked).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
const supplierShipping = (supplierItems: CartItem[]) => {
  const checked = supplierItems.filter((item) => item.checked)
  if (!checked.length) return 0
  const sample = checked[0]!
  return supplierAmount(checked) >= sample.freeShippingThreshold ? 0 : sample.shippingFee
}

onMounted(() => cartStore.loadCart().catch(() => undefined))
</script>

<template>
  <main class="cart-page">
    <header class="cart-heading">
      <div><p class="eyebrow coral">SHOPPING CART</p><h1>장바구니</h1></div>
      <ol><li class="active">01 장바구니</li><li>02 주문·결제</li><li>03 주문완료</li></ol>
    </header>

    <div v-if="loading && !items.length" class="cart-loading">장바구니를 불러오는 중입니다.</div>
    <div v-else-if="error && !items.length" class="cart-error"><strong>장바구니를 불러오지 못했습니다.</strong><p>{{ error }}</p><button @click="cartStore.loadCart()">다시 시도</button></div>
    <div v-else-if="!items.length" class="cart-empty"><span>Bag</span><strong>장바구니가 비어 있습니다.</strong><p>판매할 상품을 둘러보고 장바구니에 담아보세요.</p><RouterLink to="/">도매 상품 둘러보기</RouterLink></div>

    <div v-else class="cart-layout">
      <section class="cart-list">
        <div class="cart-toolbar">
          <label><input type="checkbox" :checked="allChecked" @change="cartStore.toggleAll" /> 전체 선택</label>
          <button @click="cartStore.removeItems(items.filter((item) => item.checked).map((item) => item.id))">선택 삭제</button>
        </div>

        <article v-for="group in supplierGroups" :key="group.supplierId" class="supplier-cart-group">
          <header><div><strong>{{ group.supplierName }}</strong><span>✓ 사업자 인증</span></div><RouterLink to="/categories">도매처 상품 더보기 →</RouterLink></header>
          <div v-for="item in group.items" :key="item.id" class="cart-item">
            <input type="checkbox" :checked="item.checked" :aria-label="`${item.productName} 선택`" @change="cartStore.toggleItem(item)" />
            <RouterLink class="cart-item-image" :to="`/products/${item.productId}`"><img :src="item.imageUrl" :alt="item.productName" /></RouterLink>
            <div class="cart-item-info"><RouterLink :to="`/products/${item.productId}`">{{ item.productName }}</RouterLink><span>옵션: {{ item.optionName }}</span><small>최소 주문 {{ item.minOrderQuantity }}개 · 재고 {{ item.stockQuantity }}개</small></div>
            <div class="cart-quantity"><button :disabled="item.quantity <= item.minOrderQuantity" @click="cartStore.updateQuantity(item, item.quantity - 1)">−</button><strong>{{ item.quantity }}</strong><button :disabled="item.quantity >= item.stockQuantity" @click="cartStore.updateQuantity(item, item.quantity + 1)">＋</button></div>
            <div class="cart-item-price"><strong>{{ formatPrice(item.unitPrice * item.quantity) }}원</strong><span>공급가 {{ formatPrice(item.unitPrice) }}원</span></div>
            <button class="remove-cart-item" :aria-label="`${item.productName} 삭제`" @click="cartStore.removeItems([item.id])">×</button>
          </div>
          <footer><span>도매처 상품금액 {{ formatPrice(supplierAmount(group.items)) }}원</span><b>+</b><span>배송비 {{ formatPrice(supplierShipping(group.items)) }}원</span><strong>{{ formatPrice(supplierAmount(group.items) + supplierShipping(group.items)) }}원</strong></footer>
        </article>
      </section>

      <aside class="cart-summary-panel">
        <h2>결제 예정 금액</h2>
        <dl><div><dt>선택 상품</dt><dd>{{ checkedCount }}개</dd></div><div><dt>상품 금액</dt><dd>{{ formatPrice(productAmount) }}원</dd></div><div><dt>배송비</dt><dd>+ {{ formatPrice(shippingAmount) }}원</dd></div></dl>
        <div class="cart-total"><span>총 결제 금액</span><strong>{{ formatPrice(totalAmount) }}원</strong><small>VAT 포함</small></div>
        <button class="checkout-button" :disabled="!checkedCount">{{ checkedCount }}개 상품 주문하기</button>
        <p>구매 확정 전까지 결제 대금을 안전하게 보호합니다.</p>
      </aside>
    </div>
  </main>
</template>
