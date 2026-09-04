<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminProductsStore } from '../stores/adminProducts'
import { useCategoriesStore } from '../stores/categories'
import { productStatusLabel } from '../data/productStatuses'
import { formatDateTime } from '../utils/dateTime'

const route = useRoute()
const router = useRouter()
const store = useAdminProductsStore()
const categoriesStore = useCategoriesStore()
const { currentProduct: product, loading, error } = storeToRefs(store)
const productSeq = computed(() => Number(route.params.id))
const isSupplier = computed(() => route.meta.adminRole !== 'seller')
const selectedImageSeq = ref<number | null>(null)
const selectedImage = computed(
  () =>
    product.value?.images.find((image) => image.seq === selectedImageSeq.value) ??
    product.value?.images[0] ??
    null,
)

async function load() {
  try {
    await categoriesStore.fetchCategories()
    const loadedProduct = await store.fetchProduct(productSeq.value)
    selectedImageSeq.value = loadedProduct.images[0]?.seq ?? null
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
  <main class="admin-content admin-detail-content">
    <nav class="admin-breadcrumbs" aria-label="현재 위치">
      <RouterLink :to="isSupplier ? '/admin/supplier/products' : '/admin/seller/products'"
        >상품 관리</RouterLink
      ><span>›</span><strong>상품 상세</strong>
    </nav>
    <section v-if="loading" class="admin-not-found">
      <strong>상품 정보를 불러오는 중입니다.</strong>
    </section>
    <section v-else-if="error || !product" class="admin-not-found">
      <strong>상품을 불러오지 못했습니다.</strong>
      <p>{{ error }}</p>
      <button type="button" @click="load">다시 시도</button>
    </section>
    <template v-else>
      <div class="admin-detail-heading">
        <div>
          <p>PRODUCT DETAIL</p>
          <div>
            <h1>{{ product.name }}</h1>
            <i class="admin-status">{{ productStatusLabel(product.status) }}</i>
          </div>
          <span
            >상품 SEQ {{ product.seq }} · 최근 수정 {{ formatDateTime(product.updatedAt) }}</span
          >
        </div>
        <div>
          <RouterLink
            class="admin-secondary-button"
            :to="isSupplier ? '/admin/supplier/products' : '/admin/seller/products'"
            >상품 관리로 가기</RouterLink
          ><RouterLink
            v-if="isSupplier"
            class="admin-primary-button"
            :to="`/admin/supplier/products/${product.seq}/edit`"
            >상품 수정</RouterLink
          >
        </div>
      </div>
      <div class="product-api-detail-layout">
        <section class="admin-detail-card admin-detail-gallery product-api-gallery">
          <div v-if="selectedImage" class="admin-detail-main-image">
            <img :src="selectedImage.imageUrl" :alt="`${product.name} 선택 이미지`" />
          </div>
          <div v-else class="admin-detail-main-image admin-detail-image-empty">
            등록된 이미지가 없습니다.
          </div>
          <div
            v-if="product.images.length > 1"
            class="admin-detail-thumbnails product-api-thumbnails"
          >
            <button
              v-for="image in product.images"
              :key="image.seq"
              type="button"
              :class="{ active: image.seq === selectedImage?.seq }"
              :aria-label="`${product.name} 이미지 ${image.sortOrder + 1} 보기`"
              :aria-pressed="image.seq === selectedImage?.seq"
              @click="selectedImageSeq = image.seq"
            >
              <img
                :src="image.imageUrl"
                :alt="`${product.name} 이미지 ${image.sortOrder + 1}`"
              /><small>{{ image.imageType }} · {{ image.sortOrder }}</small>
            </button>
          </div>
        </section>
        <section class="admin-detail-card admin-detail-summary-card product-api-detail">
          <div class="admin-detail-section-title">
            <span>기본 정보</span><small>서버 상품 상세 응답</small>
          </div>
          <dl class="admin-info-list">
            <div>
              <dt>상품 SEQ</dt>
              <dd>{{ product.seq }}</dd>
            </div>
            <div>
              <dt>도매상</dt>
              <dd class="admin-detail-wholesale">
                <strong>{{ product.wholesaleStoreName ?? '도매상명 없음' }}</strong
                ><small>SEQ {{ product.wholesaleStoreSeq }}</small>
              </dd>
            </div>
            <div>
              <dt>카테고리</dt>
              <dd>{{ categoriesStore.nameOf(product.categorySeq) }}</dd>
            </div>
            <div>
              <dt>상품 상태</dt>
              <dd>
                <i class="admin-status">{{ productStatusLabel(product.status) }}</i>
                <small>{{ product.status }}</small>
              </dd>
            </div>
            <div>
              <dt>최소 주문 수량</dt>
              <dd>{{ product.minOrderQuantity.toLocaleString() }}개</dd>
            </div>
            <div>
              <dt>조회수</dt>
              <dd>{{ product.viewCount.toLocaleString() }}회</dd>
            </div>
            <div>
              <dt>등록일</dt>
              <dd>{{ formatDateTime(product.createdAt) }}</dd>
            </div>
            <div>
              <dt>수정일</dt>
              <dd>{{ formatDateTime(product.updatedAt) }}</dd>
            </div>
          </dl>
        </section>
      </div>
      <section class="admin-detail-card admin-description-card">
        <div class="admin-detail-section-title">
          <span>상품 설명</span><small>셀러에게 제공되는 설명</small>
        </div>
        <p>{{ product.description || '등록된 상품 설명이 없습니다.' }}</p>
      </section>
      <section class="admin-detail-card admin-description-card">
        <div class="admin-detail-section-title">
          <span>옵션 정보</span><small>총 {{ product.options.length }}개</small>
        </div>
        <div class="admin-detail-table-scroll">
          <table class="admin-detail-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>옵션명</th>
                <th>옵션값</th>
                <th>정렬 순서</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="option in product.options" :key="option.seq">
                <td>{{ option.seq }}</td>
                <td>{{ option.optionName }}</td>
                <td>{{ option.optionValue }}</td>
                <td>{{ option.sortOrder }}</td>
              </tr>
              <tr v-if="!product.options.length">
                <td colspan="4">등록된 옵션이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="admin-detail-card admin-description-card">
        <div class="admin-detail-section-title">
          <span>SKU 및 가격 정보</span><small>총 {{ product.variants.length }}개</small>
        </div>
        <div class="admin-detail-table-scroll">
          <table class="admin-detail-data-table variants">
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>색상</th>
                <th>사이즈</th>
                <th>공급가</th>
                <th>판매가</th>
                <th>예상 마진</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="variant in product.variants" :key="variant.seq">
                <td>{{ variant.seq }}</td>
                <td>
                  <strong>{{ variant.sku }}</strong>
                </td>
                <td>{{ variant.color || '-' }}</td>
                <td>{{ variant.size || '-' }}</td>
                <td>{{ variant.supplyPrice.toLocaleString() }}원</td>
                <td>{{ variant.salePrice.toLocaleString() }}원</td>
                <td>{{ (variant.salePrice - variant.supplyPrice).toLocaleString() }}원</td>
                <td>
                  <i class="admin-status">{{ productStatusLabel(variant.status) }}</i>
                </td>
              </tr>
              <tr v-if="!product.variants.length">
                <td colspan="8">등록된 SKU가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </main>
</template>
