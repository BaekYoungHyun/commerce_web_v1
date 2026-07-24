<script setup lang="ts">
import { computed, ref } from 'vue'
import { products, type Product } from '../data/products'
import { useCartStore } from '../stores/cart'

const categories = ['전체', '아우터', '상의', '팬츠', '원피스', '가방', '슈즈']
const activeCategory = ref('전체')
const searchQuery = ref('')
const showToast = ref('')
const cartStore = useCartStore()

const displayedProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return products.filter((product) => {
    const matchesCategory = activeCategory.value === '전체' || product.category === activeCategory.value
    const matchesQuery = !query || `${product.supplier} ${product.name}`.toLowerCase().includes(query)
    return matchesCategory && matchesQuery
  })
})

const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price)

async function addToCart(product: Product) {
  try {
    await cartStore.addItem({
      productId: product.id,
      optionName: product.colors[0]!,
      quantity: product.minOrder,
    })
    showToast.value = `${product.name} ${product.minOrder}개를 담았습니다.`
    window.setTimeout(() => (showToast.value = ''), 2200)
  } catch {
    showToast.value = cartStore.error
  }
}
</script>

<template>
  <main>
    <section class="hero b2b-hero">
      <div class="hero-content">
        <p class="eyebrow">WHOLESALE MARKET FOR SELLERS</p>
        <h1>잘 팔리는 상품을<br /><em>더 좋은 공급가로</em></h1>
        <p class="hero-copy">검증된 도매처의 신상품을 한곳에서 비교하고 주문하세요.<br />최소 주문 수량부터 출고 일정까지 투명하게 확인할 수 있습니다.</p>
        <div class="hero-actions">
          <a class="primary-button" href="#new">도매 상품 둘러보기 <span>→</span></a>
          <RouterLink class="text-button" to="/supplier/products">도매 판매 시작하기</RouterLink>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-photo"></div>
        <div class="floating-card"><span class="spark">↗</span><div><small>이번 주 신규 등록</small><strong>1,248개 도매 상품</strong></div></div>
        <div class="margin-card"><small>평균 예상 마진</small><strong>52%</strong></div>
      </div>
    </section>

    <section id="benefits" class="benefits" aria-label="B2B 거래 혜택">
      <div><span>01</span><p><strong>사업자 인증 도매처</strong>검증된 공급자와 안심 거래</p></div>
      <div><span>02</span><p><strong>한 번에 통합 주문</strong>여러 도매처 상품도 간편하게</p></div>
      <div><span>03</span><p><strong>거래 보호 결제</strong>구매 확정까지 대금 보호</p></div>
    </section>

    <section id="new" class="product-section">
      <div class="section-heading">
        <div><p class="eyebrow coral">SELLER'S PICK</p><h2>지금 잘 팔리는 도매 상품</h2></div>
        <RouterLink class="cart-summary" to="/cart">장바구니 <strong>{{ cartStore.itemCount }}</strong>개</RouterLink>
      </div>
      <div class="market-tools">
        <div class="category-row">
          <button v-for="category in categories" :key="category" :class="{ active: activeCategory === category }" @click="activeCategory = category">{{ category }}</button>
        </div>
        <label class="inline-search"><span>⌕</span><input v-model="searchQuery" placeholder="상품명 또는 도매처 검색" /></label>
      </div>
      <div v-if="displayedProducts.length" class="product-grid">
        <article v-for="product in displayedProducts" :key="product.id" class="product-card">
          <div class="image-wrap">
            <RouterLink class="product-image-link" :to="`/products/${product.id}`" :aria-label="`${product.name} 상세보기`"><img :src="product.image" :alt="product.name" loading="lazy" /></RouterLink>
            <span v-if="product.badge" class="badge">{{ product.badge }}</span>
            <button class="quick-cart" @click="addToCart(product)">최소 수량으로 담기</button>
          </div>
          <div class="product-info">
            <p class="shop-name">{{ product.supplier }} <span class="verified">사업자 인증</span></p>
            <h3><RouterLink :to="`/products/${product.id}`">{{ product.name }}</RouterLink></h3>
            <div class="price-line"><strong>공급가</strong><b>{{ formatPrice(product.price) }}원</b></div>
            <p class="retail-price">권장 판매가 {{ formatPrice(product.retailPrice) }}원</p>
            <div class="trade-meta"><span>최소 {{ product.minOrder }}개</span><span>{{ product.delivery }}</span></div>
          </div>
        </article>
      </div>
      <div v-else class="empty-state"><strong>검색 결과가 없습니다.</strong><p>다른 상품명이나 도매처를 검색해보세요.</p></div>
    </section>

    <section class="promo-banner b2b-promo">
      <div><p>FOR WHOLESALE PARTNERS</p><h2>좋은 상품을 가진 도매라면,<br />전국 셀러를 만나보세요.</h2><RouterLink to="/supplier/products">상품 등록 시작하기 →</RouterLink></div>
      <div class="promo-word">B2B</div>
    </section>
  </main>
  <Transition name="toast"><div v-if="showToast" class="toast">✓ {{ showToast }}</div></Transition>
</template>
