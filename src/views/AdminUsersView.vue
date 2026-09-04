<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminUsersStore } from '../stores/adminUsers'
import { formatDateTime } from '../utils/dateTime'
import PageControls from '../components/PageControls.vue'

const businessTypeLabel = (value: string) => (value === 'WHOLESALE' ? '도매' : '셀러(소매)')
const roleLabel = (value: string) =>
  ({ RETAILER: '셀러', WHOLESALER: '도매', ADMIN: '관리자' })[value] ?? value

const route = useRoute()
const router = useRouter()
const store = useAdminUsersStore()
const { users, pagination, loading, error } = storeToRefs(store)
const keyword = ref('')
const filteredUsers = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return users.value
  return users.value.filter((user) =>
    [
      user.seq,
      user.userId,
      user.name,
      user.phone,
      user.businessType,
      businessTypeLabel(user.businessType),
      user.role,
      roleLabel(user.role),
      user.status,
    ].some((value) => String(value).toLowerCase().includes(query)),
  )
})

async function load(
  requestedPage: unknown = pagination.value.page,
  requestedSize = pagination.value.size,
) {
  const page = typeof requestedPage === 'number' ? requestedPage : 0
  try {
    await store.fetchUsers({
      page,
      size: requestedSize,
      keyword: keyword.value.trim() || undefined,
    })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}
onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>ADMIN USER</p>
        <h1>사용자 관리</h1>
        <span>서비스 사용자를 조회하고 계정 정보를 등록·수정합니다.</span>
      </div>
      <RouterLink class="admin-primary-button" to="/admin/users/new">+ 사용자 등록</RouterLink>
    </div>
    <section class="admin-summary admin-business-summary">
      <div>
        <span>전체 사용자</span><strong>{{ users.length }}</strong
        ><small>명</small>
      </div>
      <div>
        <span>검색 결과</span><strong>{{ filteredUsers.length }}</strong
        ><small>명</small>
      </div>
    </section>
    <form class="admin-filter-panel admin-business-filters" @submit.prevent>
      <label class="admin-search-field"
        ><span>사용자 검색</span
        ><input
          v-model="keyword"
          placeholder="SEQ, 아이디, 이름, 연락처, 사용자 구분, 상태" /></label
      ><button class="admin-reset-button" type="button" @click="keyword = ''">↻ 초기화</button
      ><button class="admin-search-button" type="button" @click="load">새로고침</button>
    </form>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>사용자 목록</h2>
          <span>총 {{ filteredUsers.length }}명</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-business-table">
          <thead>
            <tr>
              <th>SEQ</th>
              <th>사용자 ID</th>
              <th>이름</th>
              <th>연락처</th>
              <th>사업자 유형</th>
              <th>권한</th>
              <th>상태</th>
              <th>최근 로그인</th>
              <th>등록일</th>
              <th>수정일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="admin-empty">사용자 목록을 불러오는 중입니다.</td>
            </tr>
            <tr v-for="user in filteredUsers" v-else :key="user.seq">
              <td>{{ user.seq }}</td>
              <td>{{ user.userId }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.phone }}</td>
              <td>
                <i class="admin-status">{{ businessTypeLabel(user.businessType) }}</i>
              </td>
              <td>
                <i class="admin-status">{{ roleLabel(user.role) }}</i>
              </td>
              <td>
                <i class="admin-status">{{ user.status }}</i>
              </td>
              <td>{{ formatDateTime(user.lastLoginAt) }}</td>
              <td>{{ formatDateTime(user.createdAt) }}</td>
              <td>{{ formatDateTime(user.updatedAt) }}</td>
              <td>
                <div class="admin-row-actions">
                  <RouterLink :to="`/admin/users/${user.seq}/edit`">수정</RouterLink>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && filteredUsers.length === 0">
              <td colspan="11" class="admin-empty">조회된 사용자가 없습니다.</td>
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
