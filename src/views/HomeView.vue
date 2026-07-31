<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { products as sampleProducts } from '../data/products'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useCategoriesStore } from '../stores/categories'
import { useCatalogProductsStore } from '../stores/catalogProducts'
import CatalogProductCard from '../components/CatalogProductCard.vue'

const activeCategorySeq = ref<number | null>(null)
const searchQuery = ref('')
const cartStore = useCartStore()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const catalogStore = useCatalogProductsStore()
const { products: apiProducts, pageData, loading, error } = storeToRefs(catalogStore)
const heroProduct = sampleProducts[0]!
const editorialStories = [
  { eyebrow: 'SELLER EDIT', title: '이번 시즌, 셀러가 먼저 보는 아우터', copy: '반응이 빠른 실루엣과 안정적인 공급 조건을 함께 골랐습니다.', product: sampleProducts[3]! },
  { eyebrow: 'MARGIN GUIDE', title: '가격보다 오래 남는 좋은 마진', copy: '공급가와 권장 판매가를 비교해 사업에 맞는 상품을 발견하세요.', product: sampleProducts[24]! },
  { eyebrow: 'NEW WHOLESALE', title: '이번 주 새로 만나는 도매 브랜드', copy: '새로운 거래처와 상품을 한발 먼저 소개합니다.', product: sampleProducts[47]! },
]
const featuredProducts = computed(() => apiProducts.value.slice(0, 10))

async function loadProducts(page = 0) {
  if (!authStore.accessToken) return
  await catalogStore.fetchProducts({ page, size: 20, categorySeq: activeCategorySeq.value ?? undefined, name: searchQuery.value.trim() || undefined }).catch(() => undefined)
}

async function selectCategory(seq: number | null) { activeCategorySeq.value = seq; await loadProducts(0) }

watch(() => authStore.accessToken, async (token) => { if (token) { await categoriesStore.fetchCategories().catch(() => undefined); await loadProducts(0) } }, { immediate: true })
</script>

<template>
  <main>
    <section class="editorial-hero">
      <div class="editorial-hero-media" aria-hidden="true">
        <img :src="heroProduct.image" alt="" />
      </div>
      <div class="editorial-hero-copy">
        <p>YH MARKET · BUSINESS</p>
        <h1>사업자를 위한 도매 상품</h1>
        <span>검증된 공급사의 상품을 합리적인 공급가로 만나보세요.</span>
        <a class="editorial-hero-action" href="#new">도매 상품 보기</a>
      </div>
    </section>

    <section id="benefits" class="business-index" aria-label="B2B 거래 혜택">
      <p>BUSINESS INDEX</p><div><strong>01</strong><span>인증된 도매처</span></div><div><strong>02</strong><span>투명한 공급 조건</span></div><div><strong>03</strong><span>셀러 중심 큐레이션</span></div><div><strong>04</strong><span>안전한 B2B 거래</span></div>
    </section>

    <section class="editorial-section">
      <header><p>YH EDITORIAL</p><h2>판매의 다음 장면을<br />먼저 발견하세요.</h2></header>
      <div class="editorial-story-grid">
        <article v-for="story in editorialStories" :key="story.title" class="editorial-story"><RouterLink :to="`/products/${story.product.id}`"><img :src="story.product.image" :alt="story.product.name" /></RouterLink><p>{{ story.eyebrow }}</p><h3>{{ story.title }}</h3><span>{{ story.copy }}</span><RouterLink :to="`/products/${story.product.id}`">자세히 보기 →</RouterLink></article>
      </div>
    </section>

    <section id="new" class="product-section">
      <div class="section-heading">
        <div><p class="eyebrow coral">NEW ARRIVALS</p><h2>새롭게 도착한 도매 상품</h2></div>
        <RouterLink class="cart-summary" to="/cart">장바구니 <strong>{{ cartStore.itemCount }}</strong>개</RouterLink>
      </div>
      <div v-if="featuredProducts.length" class="home-new-products"><CatalogProductCard v-for="(product, index) in featuredProducts" :key="product.seq" :product="product" :rank="index + 1" /></div>
      <div class="section-divider"><span>ALL WHOLESALE PRODUCTS</span></div>
      <div class="market-tools">
        <div class="category-row">
          <button :class="{ active: activeCategorySeq === null }" @click="selectCategory(null)">전체</button><button v-for="category in categoriesStore.options" :key="category.seq" :class="{ active: activeCategorySeq === category.seq }" @click="selectCategory(category.seq)">{{ category.label }}</button>
        </div>
        <label class="inline-search"><span>⌕</span><input v-model="searchQuery" placeholder="상품명 검색" @keyup.enter="loadProducts(0)" /></label>
      </div>
      <div v-if="!authStore.accessToken" class="catalog-api-state"><strong>사업자 로그인 후 도매 상품을 확인할 수 있습니다.</strong><RouterLink to="/login">로그인하기 →</RouterLink></div>
      <div v-else-if="loading" class="catalog-api-state"><strong>도매 상품을 불러오는 중입니다.</strong></div>
      <div v-else-if="error" class="catalog-api-state"><strong>{{ error }}</strong><button type="button" @click="loadProducts(pageData.page)">다시 시도</button></div>
      <div v-else-if="apiProducts.length" class="catalog-api-grid"><CatalogProductCard v-for="product in apiProducts" :key="product.seq" :product="product" /></div>
      <div v-else class="catalog-api-state"><strong>조건에 맞는 상품이 없습니다.</strong><p>다른 카테고리나 상품명으로 검색해보세요.</p></div>
      <div v-if="pageData.totalPages > 1" class="catalog-api-pagination"><button type="button" :disabled="pageData.page === 0 || loading" @click="loadProducts(pageData.page - 1)">이전</button><span>{{ pageData.page + 1 }} / {{ pageData.totalPages }}</span><button type="button" :disabled="pageData.page + 1 >= pageData.totalPages || loading" @click="loadProducts(pageData.page + 1)">다음</button></div>
    </section>

    <section class="wholesale-manifesto">
      <p>FOR WHOLESALE PARTNERS</p><h2>당신의 좋은 상품이<br />더 많은 셀러를 만나는 곳.</h2><span>YH MARKET은 도매 브랜드의 가치와 거래 조건을 정확하게 전달합니다.</span><RouterLink to="/admin/supplier/products/new">상품 등록 시작하기 →</RouterLink>
    </section>
  </main>
</template>
