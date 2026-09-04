<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import PageControls from '../components/PageControls.vue'
import { ApiError } from '../services/httpClient'
import { useAdminInquiriesStore } from '../stores/adminInquiries'
import type { InquiryStatus } from '../types/adminInquiry'
import { formatDateTime } from '../utils/dateTime'

const route = useRoute()
const router = useRouter()
const store = useAdminInquiriesStore()
const { inquiries, pagination, loading, savingSeq, error } = storeToRefs(store)
const filters = reactive({ keyword: '', category: '', status: '', businessType: '' })
const selectedSeq = ref<number | null>(null)
const answer = ref('')
const validationError = ref('')

const statusLabel = (status: InquiryStatus) =>
  ({ OPEN: '접수', ANSWERED: '답변 완료', CLOSED: '종료' })[status]
const businessTypeLabel = (type: string) => (type === 'WHOLESALE' ? '도매' : '셀러')

async function load(
  requestedPage: unknown = pagination.value.page,
  requestedSize = pagination.value.size,
) {
  const page = typeof requestedPage === 'number' ? requestedPage : 0
  try {
    await store.fetchInquiries({
      page,
      size: requestedSize,
      keyword: filters.keyword.trim() || undefined,
      category: filters.category.trim() || undefined,
      status: (filters.status || undefined) as InquiryStatus | undefined,
      businessType: (filters.businessType || undefined) as 'WHOLESALE' | 'RETAIL' | undefined,
    })
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

function reset() {
  Object.assign(filters, { keyword: '', category: '', status: '', businessType: '' })
  void load(0)
}

function openAnswer(seq: number, currentAnswer: string | null) {
  selectedSeq.value = selectedSeq.value === seq ? null : seq
  answer.value = currentAnswer ?? ''
  validationError.value = ''
}

async function submitAnswer(seq: number) {
  const content = answer.value.trim()
  if (!content) {
    validationError.value = '답변 내용을 입력해주세요.'
    return
  }
  validationError.value = ''
  try {
    await store.saveAnswer(seq, content)
    selectedSeq.value = null
  } catch {
    // 공통 오류 영역에서 서버 응답 메시지를 표시한다.
  }
}

async function updateStatus(seq: number, event: Event) {
  const status = (event.target as HTMLSelectElement).value as InquiryStatus
  try {
    await store.changeStatus(seq, status)
  } catch {
    await load(pagination.value.page)
  }
}

onMounted(() => load(0))
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>SUPPORT ADMIN</p>
        <h1>전체 문의 관리</h1>
        <span>도매·셀러 사용자의 문의를 조회하고 답변과 처리 상태를 관리합니다.</span>
      </div>
    </div>
    <form class="admin-filter-panel admin-inquiry-filters" @submit.prevent="load(0)">
      <label class="admin-search-field">
        <span>문의 검색</span>
        <input v-model="filters.keyword" placeholder="제목, 내용, 사용자 ID·이름" />
      </label>
      <label
        ><span>문의 유형</span><input v-model="filters.category" placeholder="예: 주문, 상품"
      /></label>
      <label
        ><span>사용자 구분</span
        ><select v-model="filters.businessType">
          <option value="">전체</option>
          <option value="WHOLESALE">도매</option>
          <option value="RETAIL">셀러</option>
        </select></label
      >
      <label
        ><span>처리 상태</span
        ><select v-model="filters.status">
          <option value="">전체</option>
          <option value="OPEN">접수</option>
          <option value="ANSWERED">답변 완료</option>
          <option value="CLOSED">종료</option>
        </select></label
      >
      <button class="admin-reset-button" type="button" @click="reset">↻ 초기화</button>
      <button class="admin-search-button" type="submit">검색</button>
    </form>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load()">다시 시도</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>전체 문의 목록</h2>
          <span>총 {{ pagination.totalElements.toLocaleString() }}건</span>
        </div>
      </div>
      <div class="admin-table-scroll">
        <table class="admin-product-table admin-inquiry-table">
          <thead>
            <tr>
              <th>SEQ</th>
              <th>구분</th>
              <th>문의자</th>
              <th>유형</th>
              <th>제목·내용</th>
              <th>등록일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="admin-empty">전체 문의를 불러오는 중입니다.</td>
            </tr>
            <template v-for="inquiry in inquiries" v-else :key="inquiry.seq">
              <tr>
                <td>{{ inquiry.seq }}</td>
                <td>
                  <i class="admin-status">{{ businessTypeLabel(inquiry.businessType) }}</i>
                </td>
                <td>
                  <strong>{{ inquiry.userName }}</strong
                  ><small class="admin-inquiry-user"
                    >{{ inquiry.userId }} · #{{ inquiry.userSeq }}</small
                  >
                </td>
                <td>{{ inquiry.category }}</td>
                <td class="admin-inquiry-copy">
                  <strong>{{ inquiry.title }}</strong>
                  <p>{{ inquiry.content }}</p>
                  <small v-if="inquiry.answer">답변: {{ inquiry.answer }}</small>
                </td>
                <td>{{ formatDateTime(inquiry.createdAt) }}</td>
                <td>
                  <select
                    :value="inquiry.status"
                    :disabled="savingSeq === inquiry.seq"
                    aria-label="문의 상태"
                    @change="updateStatus(inquiry.seq, $event)"
                  >
                    <option value="OPEN">접수</option>
                    <option value="ANSWERED">답변 완료</option>
                    <option value="CLOSED">종료</option></select
                  ><small class="admin-inquiry-user">{{ statusLabel(inquiry.status) }}</small>
                </td>
                <td>
                  <button
                    class="admin-table-action"
                    type="button"
                    @click="openAnswer(inquiry.seq, inquiry.answer)"
                  >
                    {{ inquiry.answer ? '답변 수정' : '답변' }}
                  </button>
                </td>
              </tr>
              <tr v-if="selectedSeq === inquiry.seq" class="admin-inquiry-answer-row">
                <td colspan="8">
                  <form @submit.prevent="submitAnswer(inquiry.seq)">
                    <label
                      ><span>관리자 답변</span
                      ><textarea
                        v-model="answer"
                        rows="5"
                        maxlength="4000"
                        placeholder="사용자에게 전달할 답변을 입력해주세요."
                      ></textarea>
                    </label>
                    <p v-if="validationError" class="admin-list-error" role="alert">
                      {{ validationError }}
                    </p>
                    <div class="admin-common-form-actions">
                      <button type="button" @click="selectedSeq = null">취소</button
                      ><button
                        class="admin-primary-button"
                        type="submit"
                        :disabled="savingSeq === inquiry.seq"
                      >
                        {{ savingSeq === inquiry.seq ? '저장 중' : '답변 저장' }}
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            </template>
            <tr v-if="!loading && inquiries.length === 0">
              <td colspan="8" class="admin-empty">조회된 문의가 없습니다.</td>
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
