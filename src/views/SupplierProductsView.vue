<script setup lang="ts">
import { computed, ref } from 'vue'

type ManagedProduct = { id: number; name: string; price: number; stock: number; minOrder: number; status: '판매중' | '판매중지' }

const products = ref<ManagedProduct[]>([
  { id: 1, name: '오버핏 코튼 워크 자켓', price: 28900, stock: 126, minOrder: 3, status: '판매중' },
  { id: 2, name: '워싱 와이드 데님 팬츠', price: 21900, stock: 58, minOrder: 5, status: '판매중' },
])
const name = ref('')
const price = ref<number | null>(null)
const stock = ref<number | null>(null)
const minOrder = ref(3)
const isFormOpen = ref(false)
const activeCount = computed(() => products.value.filter((item) => item.status === '판매중').length)
const formatPrice = (value: number) => new Intl.NumberFormat('ko-KR').format(value)

function addProduct() {
  if (!name.value || price.value === null || stock.value === null) return
  products.value.unshift({ id: Date.now(), name: name.value, price: price.value, stock: stock.value, minOrder: minOrder.value, status: '판매중' })
  name.value = ''
  price.value = null
  stock.value = null
  minOrder.value = 3
  isFormOpen.value = false
}

function toggleStatus(product: ManagedProduct) {
  product.status = product.status === '판매중' ? '판매중지' : '판매중'
}
</script>

<template>
  <main class="dashboard-page">
    <div class="dashboard-heading">
      <div><p class="eyebrow coral">WHOLESALE CENTER</p><h1>상품 관리</h1><p>셀러에게 판매할 도매 상품과 재고를 관리하세요.</p></div>
      <button class="primary-action" @click="isFormOpen = !isFormOpen">+ 새 상품 등록</button>
    </div>
    <section class="summary-grid">
      <div><span>전체 상품</span><strong>{{ products.length }}</strong><small>개</small></div>
      <div><span>판매중</span><strong>{{ activeCount }}</strong><small>개</small></div>
      <div><span>오늘 주문</span><strong>24</strong><small>건</small></div>
    </section>
    <form v-if="isFormOpen" class="product-form" @submit.prevent="addProduct">
      <div class="form-title"><h2>새 상품 등록</h2><button type="button" @click="isFormOpen = false">×</button></div>
      <label>상품명<input v-model="name" required placeholder="상품명을 입력하세요" /></label>
      <label>공급가<input v-model.number="price" required min="0" type="number" placeholder="원" /></label>
      <label>재고<input v-model.number="stock" required min="0" type="number" placeholder="개" /></label>
      <label>최소 주문 수량<input v-model.number="minOrder" required min="1" type="number" /></label>
      <button class="submit-button" type="submit">상품 등록</button>
    </form>
    <section class="management-panel">
      <div class="panel-heading"><h2>등록 상품</h2><span>최근 등록순</span></div>
      <div class="product-table">
        <div class="table-row table-head"><span>상품명</span><span>공급가</span><span>재고</span><span>최소 주문</span><span>상태</span><span>관리</span></div>
        <div v-for="product in products" :key="product.id" class="table-row">
          <strong>{{ product.name }}</strong><span>{{ formatPrice(product.price) }}원</span><span>{{ product.stock }}개</span><span>{{ product.minOrder }}개</span><span><i :class="{ off: product.status === '판매중지' }">{{ product.status }}</i></span><button @click="toggleStatus(product)">{{ product.status === '판매중' ? '판매 중지' : '판매 재개' }}</button>
        </div>
      </div>
    </section>
  </main>
</template>
