<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/httpClient'
import { useAdminCommonStore } from '../stores/adminCommon'
import { formatDateTime } from '../utils/dateTime'

const route = useRoute()
const router = useRouter()
const store = useAdminCommonStore()
const { notifications, loading, error } = storeToRefs(store)
const readingSeq = ref<number | null>(null)
const unreadCount = computed(() => notifications.value.filter((item) => !item.readAt).length)

async function load() {
  try {
    await store.fetchNotifications()
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401)
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

async function markRead(seq: number) {
  readingSeq.value = seq
  try {
    await store.readNotification(seq)
  } catch {
    // 스토어 오류 영역에서 서버 메시지를 표시한다.
  } finally {
    readingSeq.value = null
  }
}

onMounted(load)
</script>

<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>NOTIFICATIONS</p>
        <h1>알림</h1>
        <span>주문과 운영 관련 최신 알림을 확인합니다.</span>
      </div>
    </div>
    <p v-if="error" class="admin-list-error" role="alert">
      {{ error }} <button type="button" @click="load">다시 시도</button>
    </p>
    <section class="admin-table-panel">
      <div class="admin-table-toolbar">
        <div>
          <h2>내 알림</h2>
          <span>읽지 않은 알림 {{ unreadCount }}건 · 전체 {{ notifications.length }}건</span>
        </div>
      </div>
      <div v-if="loading" class="admin-common-state">알림을 불러오는 중입니다.</div>
      <div v-else-if="notifications.length" class="admin-notification-list">
        <article
          v-for="notification in notifications"
          :key="notification.seq"
          :class="{ unread: !notification.readAt }"
        >
          <span class="admin-notification-dot" aria-hidden="true" />
          <div>
            <small>{{ notification.type }}</small>
            <h3>{{ notification.title }}</h3>
            <p>{{ notification.message }}</p>
            <time v-if="notification.readAt">읽음 {{ formatDateTime(notification.readAt) }}</time>
          </div>
          <button
            v-if="!notification.readAt"
            type="button"
            :disabled="readingSeq === notification.seq"
            @click="markRead(notification.seq)"
          >
            {{ readingSeq === notification.seq ? '처리 중' : '읽음 처리' }}
          </button>
          <span v-else class="admin-notification-read">읽음</span>
        </article>
      </div>
      <div v-else class="admin-common-state">도착한 알림이 없습니다.</div>
    </section>
  </main>
</template>
