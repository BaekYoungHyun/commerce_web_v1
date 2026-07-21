<script setup lang="ts">
import { computed, ref } from 'vue'

type Product = {
  id: number
  shop: string
  name: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  badge?: string
  rating: number
  reviews: number
}

const categories = [
  '전체',
  '아우터',
  '상의',
  '팬츠',
  '원피스',
  '스커트',
  '가방',
  '슈즈',
  '액세서리',
]
const activeCategory = ref('전체')
const searchQuery = ref('')
const isSearchOpen = ref(false)
const cartCount = ref(2)
const favorites = ref<number[]>([2])
const showToast = ref('')

const products: Product[] = [
  {
    id: 1,
    shop: '모먼트무드',
    name: '오버핏 코튼 워크 자켓',
    price: 58900,
    originalPrice: 79000,
    discount: 25,
    image:
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85',
    badge: 'BEST',
    rating: 4.9,
    reviews: 126,
  },
  {
    id: 2,
    shop: '애프터먼데이',
    name: '빈티지 스트라이프 니트',
    price: 32900,
    originalPrice: 47000,
    discount: 30,
    image:
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=85',
    badge: '주문폭주',
    rating: 4.8,
    reviews: 89,
  },
  {
    id: 3,
    shop: '오브제룸',
    name: '클래식 와이드 슬랙스',
    price: 41900,
    originalPrice: 52000,
    discount: 19,
    image:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=85',
    rating: 4.9,
    reviews: 211,
  },
  {
    id: 4,
    shop: '데일리유',
    name: '소프트 하프 트렌치 코트',
    price: 79800,
    originalPrice: 99000,
    discount: 19,
    image:
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=85',
    badge: 'NEW',
    rating: 4.7,
    reviews: 48,
  },
  {
    id: 5,
    shop: '르바인',
    name: '버터 스퀘어 숄더백',
    price: 38900,
    originalPrice: 46000,
    discount: 15,
    image:
      'https://images.unsplash.com/photo-1559563458-527698bf5295?auto=format&fit=crop&w=800&q=85',
    rating: 4.8,
    reviews: 73,
  },
]

const displayedProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return products
  return products.filter((product) =>
    `${product.shop} ${product.name}`.toLowerCase().includes(query),
  )
})

function toggleFavorite(id: number) {
  favorites.value = favorites.value.includes(id)
    ? favorites.value.filter((item) => item !== id)
    : [...favorites.value, id]
}

function addToCart(product: Product) {
  cartCount.value += 1
  showToast.value = `${product.name}을 장바구니에 담았어요.`
  window.setTimeout(() => (showToast.value = ''), 2200)
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price)
}
</script>

<template>
  <div class="page-shell">
    <div class="notice-bar">
      <p><strong>첫 구매 혜택</strong> 가입 즉시 10% 쿠폰 + 무료배송</p>
      <button aria-label="공지 닫기">×</button>
    </div>

    <header class="header">
      <div class="header-inner">
        <a class="brand" href="#" aria-label="YH마켓 홈"><span>YH</span>MARKET</a>
        <nav class="main-nav" aria-label="주요 메뉴">
          <a class="active" href="#new">신상</a>
          <a href="#best">베스트</a>
          <a href="#sale">세일</a>
          <a href="#shops">쇼핑몰</a>
        </nav>
        <div class="header-actions">
          <button
            class="icon-button search-toggle"
            aria-label="검색"
            @click="isSearchOpen = !isSearchOpen"
          >
            ⌕
          </button>
          <button class="icon-button" aria-label="찜 목록">
            ♡<span v-if="favorites.length" class="count">{{ favorites.length }}</span>
          </button>
          <button class="icon-button" aria-label="장바구니">
            Bag<span class="count">{{ cartCount }}</span>
          </button>
          <button class="login-button">로그인</button>
        </div>
      </div>
      <div v-if="isSearchOpen" class="search-panel">
        <div class="search-box">
          <span>⌕</span>
          <input
            v-model="searchQuery"
            autofocus
            placeholder="찾고 싶은 상품이나 쇼핑몰을 검색해보세요"
            aria-label="상품 검색"
          />
          <button v-if="searchQuery" @click="searchQuery = ''">지우기</button>
        </div>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="hero-content">
          <p class="eyebrow">NEW SEASON · 2026 SUMMER</p>
          <h1>매일 새로워지는<br /><em>나만의 스타일</em></h1>
          <p class="hero-copy">
            오늘 올라온 신상부터 지금 가장 사랑받는 아이템까지.<br />YH마켓에서 취향에 꼭 맞는
            스타일을 발견해보세요.
          </p>
          <a class="primary-button" href="#new">신상 보러가기 <span>→</span></a>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="hero-photo"></div>
          <div class="floating-card">
            <span class="spark">✦</span>
            <div><small>이번 주</small><strong>1,248개의 신상</strong></div>
          </div>
          <div class="hero-caption">YH EDIT<br /><span>Light &amp; Easy</span></div>
        </div>
      </section>

      <section class="benefits" aria-label="YH마켓 혜택">
        <div>
          <span>01</span>
          <p><strong>매일 업데이트</strong>가장 빠른 신상 소식</p>
        </div>
        <div>
          <span>02</span>
          <p><strong>안심 결제</strong>구매 확정까지 안전하게</p>
        </div>
        <div>
          <span>03</span>
          <p><strong>합배송 혜택</strong>여러 쇼핑몰도 한 번에</p>
        </div>
      </section>

      <section id="new" class="product-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow coral">JUST DROPPED</p>
            <h2>오늘의 신상</h2>
          </div>
          <a href="#new">전체보기 <span>→</span></a>
        </div>
        <div class="category-row">
          <button
            v-for="category in categories"
            :key="category"
            :class="{ active: activeCategory === category }"
            @click="activeCategory = category"
          >
            {{ category }}
          </button>
        </div>
        <div v-if="displayedProducts.length" class="product-grid">
          <article v-for="product in displayedProducts" :key="product.id" class="product-card">
            <div class="image-wrap">
              <img :src="product.image" :alt="product.name" loading="lazy" />
              <span v-if="product.badge" class="badge">{{ product.badge }}</span>
              <button
                class="heart"
                :class="{ selected: favorites.includes(product.id) }"
                :aria-label="`${product.name} 찜하기`"
                @click="toggleFavorite(product.id)"
              >
                {{ favorites.includes(product.id) ? '♥' : '♡' }}
              </button>
              <button class="quick-cart" @click="addToCart(product)">장바구니 담기</button>
            </div>
            <div class="product-info">
              <p class="shop-name">{{ product.shop }} <span>›</span></p>
              <h3>{{ product.name }}</h3>
              <div class="price-line">
                <strong v-if="product.discount">{{ product.discount }}%</strong
                ><b>{{ formatPrice(product.price) }}원</b>
              </div>
              <p class="rating">
                ★ {{ product.rating }} <span>리뷰 {{ product.reviews }}</span>
              </p>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <strong>검색 결과가 없어요.</strong>
          <p>다른 검색어를 입력해보세요.</p>
        </div>
      </section>

      <section id="sale" class="promo-banner">
        <div>
          <p>YH MARKET EXCLUSIVE</p>
          <h2>이번 주말만,<br />여름 아이템 최대 40%</h2>
          <a href="#new">기획전 둘러보기 →</a>
        </div>
        <div class="promo-word">SALE</div>
      </section>
    </main>

    <footer>
      <a class="brand footer-brand" href="#"><span>YH</span>MARKET</a>
      <p>좋아하는 스타일을 가장 먼저 만나는 곳</p>
      <div><a href="#">이용약관</a><a href="#">개인정보처리방침</a><a href="#">고객센터</a></div>
      <small>© 2026 YH MARKET. All rights reserved.</small>
    </footer>
    <Transition name="toast"
      ><div v-if="showToast" class="toast">✓ {{ showToast }}</div></Transition
    >
  </div>
</template>
