<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { products } from '../data/products'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const product = computed(() => products.find((item) => item.id === Number(route.params.id)))
const quantity = ref(product.value?.minOrder ?? 1)
const selectedColor = ref(product.value?.colors[0] ?? '')
const selectedImage = ref(product.value?.detailImages[0] ?? '')
const showToast = ref(false)
const toastMessage = ref('')
const cartStore = useCartStore()

watch(product, (value) => {
  quantity.value = value?.minOrder ?? 1
  selectedColor.value = value?.colors[0] ?? ''
  selectedImage.value = value?.detailImages[0] ?? ''
})

const totalPrice = computed(() => (product.value?.price ?? 0) * quantity.value)
const marginRate = computed(() => {
  if (!product.value) return 0
  return Math.round(((product.value.retailPrice - product.value.price) / product.value.retailPrice) * 100)
})
const formatPrice = (value: number) => new Intl.NumberFormat('ko-KR').format(value)

function changeQuantity(amount: number) {
  if (!product.value) return
  quantity.value = Math.min(product.value.stock, Math.max(product.value.minOrder, quantity.value + amount))
}

async function addToCart() {
  if (!product.value) return
  try {
    await cartStore.addItem({
      productId: product.value.id,
      optionName: selectedColor.value,
      quantity: quantity.value,
    })
    toastMessage.value = `${product.value.name} ${quantity.value}개를 장바구니에 담았습니다.`
  } catch {
    toastMessage.value = cartStore.error
  }
  showToast.value = true
  window.setTimeout(() => (showToast.value = false), 2200)
}
</script>

<template>
  <main v-if="product" class="detail-page">
    <nav class="breadcrumbs" aria-label="현재 위치">
      <RouterLink to="/">도매 상품</RouterLink><span>›</span><span>{{ product.category }}</span><span>›</span><strong>{{ product.name }}</strong>
    </nav>

    <section class="detail-layout">
      <div class="detail-gallery">
        <div class="detail-thumbnails" aria-label="상품 상세 이미지 선택">
          <button
            v-for="(image, index) in product.detailImages"
            :key="image"
            :class="{ active: selectedImage === image }"
            :aria-label="`${product.name} 상세 이미지 ${index + 1} 보기`"
            @click="selectedImage = image"
          >
            <img :src="image" :alt="`${product.name} 상세 이미지 ${index + 1}`" />
          </button>
        </div>
        <div class="detail-image">
          <Transition name="gallery-fade" mode="out-in">
            <img :key="selectedImage" :src="selectedImage" :alt="`${product.name} 선택 이미지`" />
          </Transition>
          <span v-if="product.badge" class="badge">{{ product.badge }}</span>
          <span class="image-counter">{{ product.detailImages.indexOf(selectedImage) + 1 }} / {{ product.detailImages.length }}</span>
        </div>
      </div>

      <div class="detail-info">
        <div class="supplier-row"><span>{{ product.supplier }}</span><strong>✓ 사업자 인증</strong></div>
        <h1>{{ product.name }}</h1>
        <p class="detail-description">{{ product.description }}</p>

        <div class="detail-pricing">
          <div><span>도매 공급가</span><strong>{{ formatPrice(product.price) }}원</strong><small>VAT 포함</small></div>
          <div><span>권장 판매가</span><b>{{ formatPrice(product.retailPrice) }}원</b></div>
          <div class="margin-highlight"><span>예상 마진율</span><b>{{ marginRate }}%</b></div>
        </div>

        <dl class="trade-conditions">
          <div><dt>최소 주문</dt><dd>{{ product.minOrder }}개부터</dd></div>
          <div><dt>재고</dt><dd>{{ product.stock }}개</dd></div>
          <div><dt>출고 예정</dt><dd>{{ product.delivery }}</dd></div>
          <div><dt>배송비</dt><dd>도매처별 3,000원 · 10만원 이상 무료</dd></div>
        </dl>

        <div class="option-block">
          <span>색상 선택</span>
          <div class="option-buttons"><button v-for="color in product.colors" :key="color" :class="{ active: selectedColor === color }" @click="selectedColor = color">{{ color }}</button></div>
        </div>

        <div class="order-box">
          <div class="quantity-control"><button aria-label="수량 줄이기" @click="changeQuantity(-1)">−</button><strong>{{ quantity }}</strong><button aria-label="수량 늘리기" @click="changeQuantity(1)">＋</button></div>
          <div class="order-total"><span>총 상품 금액</span><strong>{{ formatPrice(totalPrice) }}원</strong></div>
        </div>

        <div class="detail-actions"><button class="wish-button" aria-label="찜하기">♡</button><button class="cart-button" @click="addToCart">장바구니 담기</button><button class="buy-button">바로 주문</button></div>
        <p class="business-notice">사업자 인증 완료 후 공급가로 주문할 수 있습니다.</p>
      </div>
    </section>

    <section class="product-detail-content">
      <header>
        <p class="eyebrow coral">PRODUCT DETAIL</p>
        <h2>상품 상세 이미지</h2>
        <p>{{ product.name }}의 소재와 실루엣을 자세히 확인해보세요.</p>
      </header>
      <div class="detail-image-stack">
        <figure v-for="(image, index) in product.detailImages" :key="`detail-${image}`">
          <img :src="image" :alt="`${product.name} 상품 상세 이미지 ${index + 1}`" loading="lazy" />
          <figcaption>{{ String(index + 1).padStart(2, '0') }} / {{ String(product.detailImages.length).padStart(2, '0') }}</figcaption>
        </figure>
      </div>
    </section>

    <section class="detail-guide">
      <h2>거래 전 확인사항</h2>
      <div><article><span>01</span><strong>사업자 전용 상품</strong><p>사업자 인증 회원만 구매할 수 있습니다.</p></article><article><span>02</span><strong>최소 주문 수량</strong><p>옵션을 합산해 최소 수량 이상 주문해 주세요.</p></article><article><span>03</span><strong>안전한 거래</strong><p>구매 확정 전까지 결제 대금을 보호합니다.</p></article></div>
    </section>
  </main>

  <main v-else class="not-found"><strong>상품을 찾을 수 없습니다.</strong><RouterLink to="/">상품 목록으로 돌아가기</RouterLink></main>
  <Transition name="toast"><div v-if="showToast" class="toast">✓ {{ toastMessage }}</div></Transition>
</template>
