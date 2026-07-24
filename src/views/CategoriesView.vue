<script setup lang="ts">
import { categories } from '../data/categories'
import { products } from '../data/products'

const countProducts = (category: string) => products.filter((product) => product.category === category).length
</script>

<template>
  <main class="categories-page">
    <header class="catalog-heading">
      <p class="eyebrow coral">WHOLESALE CATEGORIES</p>
      <h1>카테고리</h1>
      <p>판매할 상품을 카테고리별로 빠르게 찾아보세요.</p>
    </header>
    <section class="category-catalog">
      <RouterLink v-for="category in categories" :key="category.name" :to="`/categories/${category.name}`" class="category-tile" :style="{ backgroundColor: category.tone }">
        <span>{{ category.icon }}</span>
        <div><small>{{ category.english }}</small><h2>{{ category.name }}</h2><p>{{ category.description }}</p></div>
        <strong>{{ countProducts(category.name) }}개 상품 →</strong>
      </RouterLink>
    </section>
  </main>
</template>
