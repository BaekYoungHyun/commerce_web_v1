<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useOrdersStore } from '../stores/orders'
import type { CartItem } from '../types/cart'

const authStore = useAuthStore()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
const router = useRouter()
const route = useRoute()
const isSellerAdmin = computed(() => route.meta.sellerAdminCart === true)
const productListPath = computed(() => (isSellerAdmin.value ? '/admin/seller/products' : '/'))
const productPath = (seq: number) =>
  isSellerAdmin.value ? `/admin/seller/products/${seq}` : `/products/${seq}`
const recipientName = ref('')
const recipientPhone = ref('')
const shippingAddressSeq = ref<number | null>(null)
const {
  cart,
  wholesaleGroups,
  items,
  loading,
  pendingItemSeqs,
  error,
  errorCode,
  allChecked,
  checkedCount,
  productAmount,
} = storeToRefs(cartStore)

const formatPrice = (value: number) => new Intl.NumberFormat('ko-KR').format(value)
const optionName = (item: CartItem) =>
  [item.color, item.size].filter(Boolean).join(' / ') || item.sku
const isSelected = (item: CartItem) =>
  cartStore.checkedItems.some((current) => current.seq === item.seq)
const requiresBusinessRegistration = () => String(errorCode.value) === 'CART004'
const hasRetailStore = computed(() => cart.value?.buyer.retailStoreSeq != null)
const orderErrorTitle = computed(() => {
  const titles: Record<string, string> = {
    C001: '주문 정보를 확인해 주세요.',
    O002: '선택한 장바구니 상품을 주문할 수 없습니다.',
    O003: '상품 주문 조건을 확인해 주세요.',
    O004: '주문 매장 권한을 확인해 주세요.',
    RS001: '소매 매장 정보를 확인해 주세요.',
    P002: '주문 가능 재고가 부족합니다.',
  }

  return titles[String(ordersStore.errorCode)] ?? '주문을 완료하지 못했습니다.'
})

watch(
  cart,
  (value) => {
    if (!value) return
    if (!recipientName.value) recipientName.value = value.buyer.name
    if (!recipientPhone.value) recipientPhone.value = value.buyer.phone
  },
  { immediate: true },
)

async function createOrder() {
  const retailStoreSeq = cart.value?.buyer.retailStoreSeq
  if (
    !cart.value ||
    retailStoreSeq == null ||
    !cartStore.checkedItems.length ||
    !recipientName.value.trim() ||
    !recipientPhone.value.trim()
  )
    return
  try {
    const createdOrders = await ordersStore.createFromCart({
      cartSeqs: cartStore.checkedItems.map((item) => item.seq),
      retailStoreSeq,
      recipientName: recipientName.value.trim(),
      recipientPhone: recipientPhone.value.trim(),
      shippingAddressSeq: shippingAddressSeq.value || null,
    })
    cartStore.clearCart()
    const firstOrder = createdOrders[0]
    if (createdOrders.length === 1 && firstOrder) {
      await router.push(
        isSellerAdmin.value
          ? `/admin/seller/orders/${firstOrder.seq}`
          : `/orders/${firstOrder.seq}`,
      )
    } else {
      await router.push(isSellerAdmin.value ? '/admin/seller/orders' : '/orders')
    }
  } catch {
    // 스토어의 API 오류 메시지를 주문 영역에 유지한다.
  }
}

onMounted(() => {
  if (authStore.accessToken) cartStore.loadCart().catch(() => undefined)
})
</script>

<template>
  <main :class="isSellerAdmin ? 'admin-content seller-admin-cart' : 'cart-page'">
    <header class="cart-heading">
      <div>
        <p class="eyebrow coral">SHOPPING CART</p>
        <h1>장바구니</h1>
      </div>
      <ol>
        <li class="active">01 장바구니</li>
        <li>02 주문·결제</li>
        <li>03 주문완료</li>
      </ol>
    </header>

    <div v-if="!authStore.accessToken" class="cart-empty">
      <span>Login</span><strong>로그인이 필요합니다.</strong>
      <p>사업자 로그인 후 장바구니를 확인할 수 있습니다.</p>
      <RouterLink :to="{ path: '/login', query: { redirect: '/cart' } }">로그인하기</RouterLink>
    </div>
    <div v-else-if="loading && !cart" class="cart-loading">장바구니를 불러오는 중입니다.</div>
    <div v-else-if="error && !cart" class="cart-error">
      <strong>{{
        requiresBusinessRegistration()
          ? '사업자 정보 등록이 필요합니다.'
          : '장바구니를 준비하지 못했습니다.'
      }}</strong>
      <p>{{ error }}</p>
      <button type="button" @click="cartStore.loadCart(true)">다시 시도</button>
    </div>

    <template v-else-if="cart">
      <section class="cart-buyer-card">
        <div>
          <p>주문 소매 매장</p>
          <strong>{{ cart.buyer.retailStoreName ?? '등록된 소매 매장 없음' }}</strong>
          <span v-if="cart.buyer.salesChannel">{{ cart.buyer.salesChannel }}</span>
        </div>
        <dl>
          <div>
            <dt>사업자</dt>
            <dd>{{ cart.buyer.companyName ?? '-' }}</dd>
          </div>
          <div>
            <dt>대표자</dt>
            <dd>{{ cart.buyer.representativeName ?? '-' }}</dd>
          </div>
          <div>
            <dt>사업자번호</dt>
            <dd>{{ cart.buyer.businessNumber ?? '-' }}</dd>
          </div>
          <div>
            <dt>담당자</dt>
            <dd>{{ cart.buyer.name }} · {{ cart.buyer.phone }}</dd>
          </div>
        </dl>
      </section>

      <div v-if="!items.length" class="cart-empty">
        <span>Bag</span><strong>장바구니가 비어 있습니다.</strong>
        <p>판매할 상품을 둘러보고 장바구니에 담아보세요.</p>
        <RouterLink :to="productListPath">도매 상품 둘러보기</RouterLink>
      </div>

      <div v-else class="cart-layout">
        <section class="cart-list">
          <div class="cart-toolbar">
            <label
              ><input type="checkbox" :checked="allChecked" @change="cartStore.toggleAll" /> 전체
              선택</label
            >
            <button
              type="button"
              :disabled="loading || !cartStore.checkedItems.length"
              @click="cartStore.removeItems(cartStore.checkedItems.map((item) => item.seq))"
            >
              선택 삭제
            </button>
          </div>

          <article
            v-for="group in wholesaleGroups"
            :key="group.wholesaleStoreSeq"
            class="supplier-cart-group"
          >
            <header>
              <div>
                <strong>{{ group.wholesaleStoreName }}</strong>
                <span>✓ {{ group.companyName }}</span>
              </div>
              <small>{{
                [group.marketName, group.floorRoom].filter(Boolean).join(' · ') ||
                `도매 매장 #${group.wholesaleStoreSeq}`
              }}</small>
            </header>
            <div v-for="item in group.items" :key="item.seq" class="cart-item">
              <input
                type="checkbox"
                :checked="isSelected(item)"
                :aria-label="`${item.productName} 선택`"
                @change="cartStore.toggleItem(item)"
              />
              <RouterLink class="cart-item-image" :to="productPath(item.productSeq)">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.productName" />
                <span v-else>NO IMAGE</span>
              </RouterLink>
              <div class="cart-item-info">
                <RouterLink :to="productPath(item.productSeq)">{{ item.productName }}</RouterLink>
                <span>옵션: {{ optionName(item) }}</span>
                <small>SKU {{ item.sku }}</small>
              </div>
              <div class="cart-quantity">
                <button
                  type="button"
                  :disabled="item.quantity <= 1 || pendingItemSeqs.has(item.seq)"
                  @click="cartStore.updateQuantity(item, item.quantity - 1)"
                >
                  −
                </button>
                <strong>{{ item.quantity }}</strong>
                <button
                  type="button"
                  :disabled="pendingItemSeqs.has(item.seq)"
                  @click="cartStore.updateQuantity(item, item.quantity + 1)"
                >
                  ＋
                </button>
              </div>
              <div class="cart-item-price">
                <strong>{{ formatPrice(item.lineAmount) }}원</strong>
                <span>판매가 {{ formatPrice(item.salePrice) }}원</span>
              </div>
              <button
                class="remove-cart-item"
                type="button"
                :disabled="loading"
                :aria-label="`${item.productName} 삭제`"
                @click="cartStore.removeItems([item.seq])"
              >
                ×
              </button>
            </div>
            <footer>
              <span>{{ group.totalQuantity }}개 상품</span>
              <strong>도매처 소계 {{ formatPrice(group.subtotalAmount) }}원</strong>
            </footer>
          </article>
          <p v-if="error" class="cart-error">{{ error }}</p>
        </section>

        <aside class="cart-summary-panel">
          <h2>선택 상품 금액</h2>
          <dl>
            <div>
              <dt>선택 수량</dt>
              <dd>{{ checkedCount }}개</dd>
            </div>
            <div>
              <dt>상품 금액</dt>
              <dd>{{ formatPrice(productAmount) }}원</dd>
            </div>
            <div>
              <dt>전체 장바구니</dt>
              <dd>{{ formatPrice(cart.totalAmount) }}원</dd>
            </div>
          </dl>
          <div class="cart-total">
            <span>선택 상품 합계</span><strong>{{ formatPrice(productAmount) }}원</strong>
            <small>서버가 확정한 품목별 금액 기준</small>
          </div>
          <div class="cart-order-fields">
            <label
              ><span>수령인</span><input v-model="recipientName" maxlength="100" required /></label
            ><label
              ><span>연락처</span><input v-model="recipientPhone" maxlength="30" required /></label
            ><label
              ><span>배송지 SEQ <small>(선택)</small></span
              ><input
                v-model.number="shippingAddressSeq"
                min="1"
                type="number"
                placeholder="등록된 배송지 SEQ"
            /></label>
          </div>
          <div v-if="!hasRetailStore" class="cart-order-error" role="alert">
            <strong>소매 매장 등록이 필요합니다.</strong>
            <p>주문하려면 로그인 사용자에게 연결된 소매 사업자와 매장 정보가 있어야 합니다.</p>
          </div>
          <div v-if="ordersStore.error" class="cart-order-error" role="alert">
            <span>{{ ordersStore.errorCode ?? 'ORDER_ERROR' }}</span>
            <strong>{{ orderErrorTitle }}</strong>
            <p>{{ ordersStore.error }}</p>
            <small>선택 상품과 수량을 확인한 후 다시 시도해 주세요.</small>
          </div>
          <button
            class="checkout-button"
            type="button"
            :disabled="
              ordersStore.creating ||
              !hasRetailStore ||
              !cartStore.checkedItems.length ||
              !recipientName.trim() ||
              !recipientPhone.trim()
            "
            @click="createOrder"
          >
            {{ ordersStore.creating ? '주문 처리 중...' : `${checkedCount}개 상품 주문하기` }}
          </button>
          <p>배송비와 최종 주문 금액은 서버가 확정합니다.</p>
        </aside>
      </div>
    </template>
  </main>
</template>
