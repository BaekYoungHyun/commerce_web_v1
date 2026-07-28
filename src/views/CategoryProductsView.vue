<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { categories } from '../data/categories'
import { products } from '../data/products'

const route = useRoute()
const keyword = ref('')
const sort = ref('recommended')
const categoryName = computed(() => String(route.params.category))
const category = computed(() => categories.find((item) => item.name === categoryName.value))
const formatPrice = (value: number) => new Intl.NumberFormat('ko-KR').format(value)

const filteredProducts = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  const list = products.filter((product) => product.category === categoryName.value && (!query || `${product.name} ${product.supplier}`.toLowerCase().includes(query)))
  if (sort.value === 'lowPrice') return [...list].sort((a, b) => a.price - b.price)
  if (sort.value === 'highMargin') return [...list].sort((a, b) => (b.retailPrice - b.price) / b.retailPrice - (a.retailPrice - a.price) / a.retailPrice)
  return list
})
</script>

<template>
  <main v-if="category" class="category-products-page">
    <nav class="breadcrumbs"><RouterLink to="/categories">카테고리</RouterLink><span>›</span><strong>{{ category.name }}</strong></nav>
    <header class="category-list-heading" :style="{ backgroundColor: category.tone }">
      <div><p>{{ category.english }}</p><h1>{{ category.name }}</h1><span>{{ category.description }}</span></div>
      <strong>{{ filteredProducts.length }}<small> PRODUCTS</small></strong>
    </header>
    <nav class="category-mini-nav" aria-label="상품 카테고리">
      <RouterLink v-for="item in categories" :key="item.name" :to="`/categories/${item.name}`" :class="{ active: item.name === category.name }">{{ item.name }}</RouterLink>
    </nav>
    <div class="list-toolbar">
      <label class="inline-search"><span>⌕</span><input v-model="keyword" placeholder="이 카테고리에서 검색" /></label>
      <select v-model="sort" aria-label="정렬"><option value="recommended">추천순</option><option value="lowPrice">낮은 공급가순</option><option value="highMargin">높은 마진순</option></select>
    </div>
    <section v-if="filteredProducts.length" class="product-grid category-grid">
      <article v-for="product in filteredProducts" :key="product.id" class="product-card">
        <RouterLink class="image-wrap product-image-link" :to="`/products/${product.id}`"><img :src="product.image" :alt="product.name" /><span v-if="product.badge" class="badge">{{ product.badge }}</span></RouterLink>
        <div class="product-info"><p class="shop-name">{{ product.supplier }} <span class="verified">사업자 인증</span></p><h3><RouterLink :to="`/products/${product.id}`">{{ product.name }}</RouterLink></h3><div class="price-line"><strong>공급가</strong><b>{{ formatPrice(product.price) }}원</b></div><p class="retail-price">권장 판매가 {{ formatPrice(product.retailPrice) }}원</p><div class="trade-meta"><span>최소 {{ product.minOrder }}개</span><span>{{ product.delivery }}</span></div></div>
      </article>
    </section>
    <div v-else class="empty-state"><strong>등록된 상품이 없습니다.</strong><p>새로운 도매 상품을 준비하고 있습니다.</p></div>
  </main>
  <main v-else class="not-found"><strong>카테고리를 찾을 수 없습니다.</strong><RouterLink to="/categories">카테고리로 돌아가기</RouterLink></main>
</template>
