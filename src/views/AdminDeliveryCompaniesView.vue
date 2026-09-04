<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminDeliveryCompaniesStore } from '../stores/adminDeliveryCompanies'
import PageControls from '../components/PageControls.vue'

const route = useRoute()
const router = useRouter()
const store = useAdminDeliveryCompaniesStore()
const { companies, pagination, loading, error } = storeToRefs(store)
const keyword = ref('')
const activeFilter = ref('all')
const filteredCompanies = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return companies.value.filter((company) => {
    const matchesActive =
      activeFilter.value === 'all' || String(company.active) === activeFilter.value
    const matchesQuery =
      !query ||
      [company.code, company.name, company.trackingUrlTemplate].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(query),
      )
    return matchesActive && matchesQuery
  })
})

async function load(
  requestedPage: unknown = pagination.value.page,
  requestedSize = pagination.value.size,
) {
  const page = typeof requestedPage === 'number' ? requestedPage : 0
  try {
    await store.fetchCompanies({
      page,
      size: requestedSize,
      keyword: keyword.value.trim() || undefined,
      active: activeFilter.value === 'all' ? undefined : activeFilter.value === 'true',
    })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) {
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
    }
  }
}

function resetFilters() {
  keyword.value = ''
  activeFilter.value = 'all'
}

onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>SERVICE ADMIN</p>
        <h1>택배사 관리</h1>
        <span>출고에 사용할 택배사 코드와 배송조회 URL을 관리합니다.</span>
      </div>
      <RouterLink class="admin-primary-button" to="/admin/delivery-companies/new"
        >+ 택배사 등록</RouterLink
      >
    </div>
    <section class="admin-summary admin-business-summary" aria-label="조회 요약">
      <div>
        <span>전체 택배사</span><strong>{{ companies.length }}</strong
        ><small>건</small>
      </div>
      <div>
        <span>활성 택배사</span
        ><strong>{{ companies.filter((company) => company.active).length }}</strong
        ><small>건</small>
      </div>
    </section>
    <form class="admin-filter-panel admin-business-filters" @submit.prevent>
      <label
        ><span>활성 상태</span
        ><select v-model="activeFilter">
          <option value="all">전체</option>
          <option value="true">활성</option>
          <option value="false">비활성</option>
        </select></label
      >
      <label class="admin-search-field"
        ><span>현재 결과 내 검색</span
        ><input v-model="keyword" placeholder="코드, 택배사명, 배송조회 URL"
      /></label>
      <button class="admin-reset-button" type="button" @click="resetFilters">↻ 초기화</button>
    </form>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>택배사 목록</h2>
          <span>총 {{ filteredCompanies.length }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table">
          <thead>
            <tr>
              <th>코드</th>
              <th>택배사명</th>
              <th>배송조회 URL 템플릿</th>
              <th>활성 상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="admin-empty">목록을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="company in filteredCompanies" v-else :key="company.code">
              <td>
                <strong>{{ company.code }}</strong>
              </td>
              <td>{{ company.name }}</td>
              <td>{{ company.trackingUrlTemplate ?? '-' }}</td>
              <td>
                <i class="admin-status">{{ company.active ? '활성' : '비활성' }}</i>
              </td>
              <td>
                <div class="admin-row-actions">
                  <RouterLink
                    :to="`/admin/delivery-companies/${encodeURIComponent(company.code)}/edit`"
                    >수정</RouterLink
                  >
                </div>
              </td>
            </tr>
            <tr v-if="!loading && filteredCompanies.length === 0">
              <td colspan="5" class="admin-empty">조회된 택배사가 없습니다.</td>
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
