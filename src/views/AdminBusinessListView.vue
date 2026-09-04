<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminBusinessesStore } from '../stores/adminBusinesses'
import type {
  AdminBusinessResource,
  BusinessProfile,
  RetailStore,
  WholesaleStore,
} from '../types/adminBusiness'
import { formatDateTime } from '../utils/dateTime'
import PageControls from '../components/PageControls.vue'

const route = useRoute()
const router = useRouter()
const store = useAdminBusinessesStore()
const { items, pagination, loading, error } = storeToRefs(store)
const businessProfileSeq = ref<number | null>(null)
const keyword = ref('')
const resource = computed(() => route.meta.businessResource as AdminBusinessResource)
const config = computed(
  () =>
    ({
      'business-profiles': {
        eyebrow: 'BUSINESS PROFILE',
        title: '사업자 프로필 관리',
        singular: '사업자 프로필',
      },
      'wholesale-stores': {
        eyebrow: 'WHOLESALE STORE',
        title: '도매 매장 관리',
        singular: '도매 매장',
      },
      'retail-stores': { eyebrow: 'RETAIL STORE', title: '소매 매장 관리', singular: '소매 매장' },
    })[resource.value],
)
const filteredItems = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return items.value
  return items.value.filter((item) =>
    Object.values(item).some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(query),
    ),
  )
})

const isProfile = (item: unknown): item is BusinessProfile => {
  void item
  return resource.value === 'business-profiles'
}
const isWholesale = (item: unknown): item is WholesaleStore => {
  void item
  return resource.value === 'wholesale-stores'
}
const isRetail = (item: unknown): item is RetailStore => {
  void item
  return resource.value === 'retail-stores'
}

async function load(
  requestedPage: unknown = pagination.value.page,
  requestedSize = pagination.value.size,
) {
  const page = typeof requestedPage === 'number' ? requestedPage : 0
  try {
    await store.fetchItems(
      resource.value,
      resource.value === 'business-profiles'
        ? { page, size: requestedSize, keyword: keyword.value.trim() || undefined }
        : {
            page,
            size: requestedSize,
            businessProfileSeq: businessProfileSeq.value ?? undefined,
            keyword: keyword.value.trim() || undefined,
          },
    )
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

function resetFilters() {
  keyword.value = ''
  businessProfileSeq.value = null
  load(0)
}

watch(resource, () => {
  businessProfileSeq.value = null
  keyword.value = ''
  load(0)
})
onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>{{ config.eyebrow }}</p>
        <h1>{{ config.title }}</h1>
        <span>서비스 운영에 필요한 사업자와 매장 정보를 API 기준으로 관리합니다.</span>
      </div>
      <RouterLink class="admin-primary-button" :to="`/admin/${resource}/new`"
        >+ {{ config.singular }} 등록</RouterLink
      >
    </div>

    <section class="admin-summary admin-business-summary" aria-label="조회 요약">
      <div>
        <span>전체 조회</span><strong>{{ items.length }}</strong
        ><small>건</small>
      </div>
      <div>
        <span>검색 결과</span><strong>{{ filteredItems.length }}</strong
        ><small>건</small>
      </div>
    </section>

    <form class="admin-filter-panel admin-business-filters" @submit.prevent="load">
      <label v-if="resource !== 'business-profiles'"
        ><span>사업자 프로필 ID</span
        ><input v-model.number="businessProfileSeq" min="1" type="number" placeholder="전체"
      /></label>
      <label class="admin-search-field"
        ><span>현재 결과 내 검색</span
        ><input v-model="keyword" placeholder="상호, 사업자번호, 매장명 검색"
      /></label>
      <button class="admin-reset-button" type="button" @click="resetFilters">↻ 초기화</button>
      <button class="admin-search-button" type="submit">조회</button>
    </form>

    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>{{ config.singular }} 목록</h2>
          <span>총 {{ filteredItems.length }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table">
          <thead>
            <tr v-if="resource === 'business-profiles'">
              <th>ID</th>
              <th>사용자 ID</th>
              <th>사용자명</th>
              <th>사업자번호</th>
              <th>상호</th>
              <th>대표자</th>
              <th>승인 상태</th>
              <th>승인일</th>
              <th>관리</th>
            </tr>
            <tr v-else-if="resource === 'wholesale-stores'">
              <th>ID</th>
              <th>프로필 ID</th>
              <th>상호</th>
              <th>사업자번호</th>
              <th>매장명</th>
              <th>시장명</th>
              <th>층/호수</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
            <tr v-else>
              <th>ID</th>
              <th>프로필 ID</th>
              <th>상호</th>
              <th>사업자번호</th>
              <th>매장명</th>
              <th>판매 채널</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="resource === 'retail-stores' ? 8 : 9" class="admin-empty">
                목록을 불러오는 중입니다.
              </td>
            </tr>
            <template v-else v-for="item in filteredItems" :key="item.seq">
              <tr v-if="isProfile(item)">
                <td>{{ item.seq }}</td>
                <td>{{ item.userId ?? item.userSeq }}</td>
                <td>{{ item.userName }}</td>
                <td>{{ item.businessNumber }}</td>
                <td>{{ item.companyName }}</td>
                <td>{{ item.representativeName }}</td>
                <td>
                  <i class="admin-status">{{ item.approvalStatus }}</i>
                </td>
                <td>{{ formatDateTime(item.approvedAt) }}</td>
                <td>
                  <div class="admin-row-actions">
                    <RouterLink :to="`/admin/${resource}/${item.seq}/edit`">수정</RouterLink>
                  </div>
                </td>
              </tr>
              <tr v-else-if="isWholesale(item)">
                <td>{{ item.seq }}</td>
                <td>{{ item.businessProfileSeq }}</td>
                <td>{{ item.companyName }}</td>
                <td>{{ item.businessNumber }}</td>
                <td>{{ item.storeName }}</td>
                <td>{{ item.marketName ?? '-' }}</td>
                <td>{{ item.floorRoom ?? '-' }}</td>
                <td>
                  <i class="admin-status">{{ item.status }}</i>
                </td>
                <td>
                  <div class="admin-row-actions">
                    <RouterLink :to="`/admin/${resource}/${item.seq}/edit`">수정</RouterLink>
                  </div>
                </td>
              </tr>
              <tr v-else-if="isRetail(item)">
                <td>{{ item.seq }}</td>
                <td>{{ item.businessProfileSeq }}</td>
                <td>{{ item.companyName }}</td>
                <td>{{ item.businessNumber }}</td>
                <td>{{ item.storeName }}</td>
                <td>{{ item.salesChannel ?? '-' }}</td>
                <td>
                  <i class="admin-status">{{ item.status }}</i>
                </td>
                <td>
                  <div class="admin-row-actions">
                    <RouterLink :to="`/admin/${resource}/${item.seq}/edit`">수정</RouterLink>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!loading && filteredItems.length === 0">
              <td :colspan="resource === 'retail-stores' ? 8 : 9" class="admin-empty">
                조회된 정보가 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PageControls
        :page="pagination.page"
        :size="pagination.size"
        :total-pages="pagination.totalPages"
        :total-elements="pagination.totalElements"
        @change="load"
      />
    </section>
  </main>
</template>
