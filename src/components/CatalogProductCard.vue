<script setup lang="ts">
import { computed } from 'vue'
import { productStatusLabel } from '../data/productStatuses'
import type { AdminProduct } from '../types/adminProduct'

const props = defineProps<{
  product: AdminProduct
  rank?: number
  detailBasePath?: string
  wishlisted?: boolean
}>()
const detailPath = computed(() => `${props.detailBasePath ?? '/products'}/${props.product.seq}`)
const primaryVariant = computed(() => props.product.variants[0] ?? null)
const supplyPrice = computed(() => primaryVariant.value?.supplyPrice ?? 0)
const salePrice = computed(() => primaryVariant.value?.salePrice ?? 0)
const marginRate = computed(() =>
  salePrice.value > 0
    ? Math.round(((salePrice.value - supplyPrice.value) / salePrice.value) * 100)
    : 0,
)
const formatPrice = (value: number) => new Intl.NumberFormat('ko-KR').format(value)
</script>

<template>
  <article class="catalog-api-card">
    <RouterLink class="catalog-api-image" :to="detailPath">
      <img
        v-if="product.images[0]"
        :src="product.images[0].imageUrl"
        :alt="product.name"
        loading="lazy"
      />
      <span v-else>NO IMAGE</span>
      <strong v-if="rank" class="catalog-rank">{{ String(rank).padStart(2, '0') }}</strong>
      <i>{{ productStatusLabel(product.status) }}</i>
      <span v-if="wishlisted" class="catalog-wishlist-mark" aria-label="찜한 상품">♥</span>
    </RouterLink>
    <div class="catalog-api-info">
      <p class="catalog-wholesale">
        <strong>{{ product.wholesaleStoreName ?? '도매상명 없음' }}</strong>
      </p>
      <h3>
        <RouterLink :to="detailPath">{{ product.name }}</RouterLink>
      </h3>
      <div class="catalog-api-price">
        <strong>{{ formatPrice(supplyPrice) }}원</strong
        ><span v-if="salePrice">권장 {{ formatPrice(salePrice) }}원</span>
      </div>
      <div class="catalog-api-meta">
        <span>최소 {{ product.minOrderQuantity }}개</span
        ><span v-if="marginRate">예상 마진 {{ marginRate }}%</span
        ><span>조회 {{ product.viewCount }}</span>
      </div>
    </div>
  </article>
</template>
