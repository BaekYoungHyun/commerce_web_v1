<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminProductsStore } from '../stores/adminProducts'

const route = useRoute()
const router = useRouter()
const store = useAdminProductsStore()
const { currentProduct: product, loading, error } = storeToRefs(store)
const productId = computed(() => Number(route.params.id))
const isSupplier = computed(() => route.meta.adminRole !== 'seller')

async function load() {
  try {
    await store.fetchProduct(productId.value)
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404 && cause.code === 'P001') {
      await router.replace(isSupplier.value ? '/admin/supplier/products' : '/admin/seller/products')
    } else if (cause instanceof ApiError && cause.status === 401) {
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
    }
  }
}

onMounted(load)
</script>

<template>
  <main class="admin-content">
    <nav class="admin-breadcrumbs" aria-label="현재 위치"><RouterLink :to="isSupplier ? '/admin/supplier/products' : '/admin/seller/products'">상품 관리</RouterLink><span>›</span><strong>상품 상세</strong></nav>
    <section v-if="loading" class="admin-not-found"><strong>상품 정보를 불러오는 중입니다.</strong></section>
    <section v-else-if="error || !product" class="admin-not-found"><strong>상품을 불러오지 못했습니다.</strong><p>{{ error }}</p><button type="button" @click="load">다시 시도</button></section>
    <template v-else>
      <div class="admin-detail-heading">
        <div><p>PRODUCT DETAIL</p><div><h1>{{ product.name }}</h1><i class="admin-status">{{ product.status }}</i></div><span>상품 ID {{ product.seq }} · 최근 수정 {{ product.updatedAt }}</span></div>
        <div><RouterLink v-if="isSupplier" class="admin-primary-button" :to="`/admin/supplier/products/${product.seq}/edit`">상품 수정</RouterLink></div>
      </div>
      <section class="admin-detail-card admin-detail-summary-card product-api-detail">
        <div class="admin-detail-section-title"><span>기본 정보</span><small>서버 상품 상세 응답</small></div>
        <dl class="admin-info-list">
          <div><dt>상품 ID</dt><dd>{{ product.seq }}</dd></div><div><dt>도매상 ID</dt><dd>{{ product.wholesaleStoreId }}</dd></div><div><dt>카테고리 ID</dt><dd>{{ product.categorySeq }}</dd></div><div><dt>상품 상태</dt><dd>{{ product.status }}</dd></div><div><dt>최소 주문 수량</dt><dd>{{ product.minOrderQuantity }}개</dd></div><div><dt>조회수</dt><dd>{{ product.viewCount }}</dd></div><div><dt>등록일</dt><dd>{{ product.createdAt }}</dd></div><div><dt>수정일</dt><dd>{{ product.updatedAt }}</dd></div>
        </dl>
      </section>
      <section class="admin-detail-card admin-description-card"><div class="admin-detail-section-title"><span>상품 설명</span><small>셀러에게 제공되는 설명</small></div><p>{{ product.description || '등록된 상품 설명이 없습니다.' }}</p></section>
      <section class="admin-detail-card admin-description-card"><div class="admin-detail-section-title"><span>상품 구성</span><small>이미지 {{ product.images.length }} · 옵션 {{ product.options.length }} · SKU {{ product.variants.length }}</small></div><p v-if="product.images.length">대표 이미지: {{ product.images[0]?.imageUrl }}</p><p v-if="product.options.length">옵션: {{ product.options.map((item) => `${item.optionName}: ${item.optionValue}`).join(', ') }}</p><p v-if="product.variants.length">SKU: {{ product.variants.map((item) => `${item.sku} (${item.supplyPrice.toLocaleString()}원 / ${item.salePrice.toLocaleString()}원)`).join(', ') }}</p><p v-if="!product.images.length && !product.options.length && !product.variants.length">등록된 이미지, 옵션, SKU가 없습니다.</p></section>
    </template>
  </main>
</template>
