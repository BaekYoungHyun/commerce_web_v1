<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSellerAdminStore } from '../stores/sellerAdmin'
import { formatDateTime } from '../utils/dateTime'
const store = useSellerAdminStore()
const { business, loading, error } = storeToRefs(store)
onMounted(() => store.fetchBusiness().catch(() => undefined))
</script>
<template>
  <main class="admin-content admin-list-content">
    <div class="admin-page-heading">
      <div>
        <p>BUSINESS & STORES</p>
        <h1>사업자·매장</h1>
        <span>로그인 사용자에게 연결된 소매 사업자와 매장을 확인합니다.</span>
      </div>
    </div>
    <p v-if="error" class="admin-list-error">{{ error }}</p>
    <div v-if="loading" class="admin-common-state">불러오는 중입니다.</div>
    <section v-else class="admin-common-list seller-business-list">
      <article v-for="profile in business?.businessProfiles ?? []" :key="profile.seq">
        <header>
          <div>
            <span>{{ profile.approvalStatus }}</span>
            <h3>{{ profile.companyName }}</h3>
          </div>
          <i class="admin-status">{{ profile.businessNumber }}</i>
        </header>
        <p>
          대표자 {{ profile.representativeName }} · 승인일 {{ formatDateTime(profile.approvedAt) }}
        </p>
        <ul>
          <li v-for="storeItem in profile.stores" :key="storeItem.seq">
            <strong>{{ storeItem.storeName }}</strong
            ><span
              >{{ storeItem.salesChannel ?? '판매 채널 미등록' }} · {{ storeItem.status }}</span
            >
          </li>
        </ul>
      </article>
      <div v-if="!business?.businessProfiles.length" class="admin-common-state">
        연결된 사업자 정보가 없습니다.
      </div>
    </section>
  </main>
</template>
