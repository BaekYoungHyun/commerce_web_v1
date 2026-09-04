import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue'),
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/OrdersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/orders/:id',
      name: 'order-detail',
      component: () => import('../views/OrderDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('../views/ProductDetailView.vue'),
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/CategoriesView.vue'),
    },
    {
      path: '/categories/:category',
      name: 'category-products',
      component: () => import('../views/CategoryProductsView.vue'),
    },
    {
      path: '/supplier/products',
      redirect: '/admin/supplier/products',
    },
    {
      path: '/admin',
      component: AdminLayout,
      redirect: '/admin/supplier/products',
      meta: { layout: 'admin', requiresAuth: true },
      children: [
        {
          path: 'inventory',
          redirect: '/admin/supplier/inventory',
        },
        {
          path: 'inventory/new',
          redirect: '/admin/supplier/inventory/new',
        },
        {
          path: 'inventory/:id/edit',
          redirect: (to) => `/admin/supplier/inventory/${String(to.params.id)}/edit`,
        },
        {
          path: 'supplier/dashboard',
          name: 'supplier-admin-dashboard',
          component: () => import('../views/WholesaleDashboardView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '대시보드' },
        },
        {
          path: 'supplier/inventory',
          name: 'supplier-admin-inventory',
          component: () => import('../views/AdminInventoryView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '상품 재고 관리' },
        },
        {
          path: 'supplier/orders',
          name: 'supplier-admin-orders',
          component: () => import('../views/WholesaleOrdersView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '주문 관리' },
        },
        {
          path: 'supplier/shipments',
          name: 'supplier-admin-shipments',
          component: () => import('../views/WholesaleShipmentsView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '출고 관리' },
        },
        {
          path: 'supplier/inventory/new',
          name: 'supplier-admin-inventory-new',
          component: () => import('../views/AdminInventoryFormView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '재고 등록' },
        },
        {
          path: 'supplier/inventory/bulk',
          name: 'supplier-admin-inventory-bulk',
          component: () => import('../views/AdminInventoryBulkView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '재고 일괄 관리' },
        },
        {
          path: 'supplier/inventory/:id/edit',
          name: 'supplier-admin-inventory-edit',
          component: () => import('../views/AdminInventoryFormView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '재고 수정' },
        },
        {
          path: 'supplier/stock-receipts',
          name: 'supplier-admin-stock-receipts',
          component: () => import('../views/AdminStockReceiptsView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '도매상품 입고 관리' },
        },
        {
          path: 'supplier/stock-receipts/new',
          name: 'supplier-admin-stock-receipt-new',
          component: () => import('../views/AdminStockReceiptFormView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '입고 등록' },
        },
        {
          path: 'supplier/stock-receipts/:id/edit',
          name: 'supplier-admin-stock-receipt-edit',
          component: () => import('../views/AdminStockReceiptFormView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '입고 수정' },
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('../views/OrdersView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '전체 주문 관리',
            adminOrders: true,
          },
        },
        {
          path: 'inquiries',
          name: 'admin-inquiries',
          component: () => import('../views/AdminAllInquiriesView.vue'),
          meta: { layout: 'admin', adminRole: 'system', adminTitle: '전체 문의 관리' },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/AdminUsersView.vue'),
          meta: { layout: 'admin', adminRole: 'system', adminTitle: '사용자 관리' },
        },
        {
          path: 'users/new',
          name: 'admin-user-new',
          component: () => import('../views/AdminUserFormView.vue'),
          meta: { layout: 'admin', adminRole: 'system', adminTitle: '사용자 등록' },
        },
        {
          path: 'users/:id/edit',
          name: 'admin-user-edit',
          component: () => import('../views/AdminUserFormView.vue'),
          meta: { layout: 'admin', adminRole: 'system', adminTitle: '사용자 수정' },
        },
        {
          path: 'business-profiles',
          name: 'admin-business-profiles',
          component: () => import('../views/AdminBusinessListView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '사업자 프로필 관리',
            businessResource: 'business-profiles',
          },
        },
        {
          path: 'business-profiles/new',
          name: 'admin-business-profile-new',
          component: () => import('../views/AdminBusinessFormView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '사업자 프로필 등록',
            businessResource: 'business-profiles',
          },
        },
        {
          path: 'business-profiles/:id/edit',
          name: 'admin-business-profile-edit',
          component: () => import('../views/AdminBusinessFormView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '사업자 프로필 수정',
            businessResource: 'business-profiles',
          },
        },
        {
          path: 'wholesale-stores',
          name: 'admin-wholesale-stores',
          component: () => import('../views/AdminBusinessListView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '도매 매장 관리',
            businessResource: 'wholesale-stores',
          },
        },
        {
          path: 'wholesale-stores/new',
          name: 'admin-wholesale-store-new',
          component: () => import('../views/AdminBusinessFormView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '도매 매장 등록',
            businessResource: 'wholesale-stores',
          },
        },
        {
          path: 'wholesale-stores/:id/edit',
          name: 'admin-wholesale-store-edit',
          component: () => import('../views/AdminBusinessFormView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '도매 매장 수정',
            businessResource: 'wholesale-stores',
          },
        },
        {
          path: 'retail-stores',
          name: 'admin-retail-stores',
          component: () => import('../views/AdminBusinessListView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '소매 매장 관리',
            businessResource: 'retail-stores',
          },
        },
        {
          path: 'retail-stores/new',
          name: 'admin-retail-store-new',
          component: () => import('../views/AdminBusinessFormView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '소매 매장 등록',
            businessResource: 'retail-stores',
          },
        },
        {
          path: 'retail-stores/:id/edit',
          name: 'admin-retail-store-edit',
          component: () => import('../views/AdminBusinessFormView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'system',
            adminTitle: '소매 매장 수정',
            businessResource: 'retail-stores',
          },
        },
        {
          path: 'delivery-companies',
          name: 'admin-delivery-companies',
          component: () => import('../views/AdminDeliveryCompaniesView.vue'),
          meta: { layout: 'admin', adminRole: 'system', adminTitle: '택배사 관리' },
        },
        {
          path: 'delivery-companies/new',
          name: 'admin-delivery-company-new',
          component: () => import('../views/AdminDeliveryCompanyFormView.vue'),
          meta: { layout: 'admin', adminRole: 'system', adminTitle: '택배사 등록' },
        },
        {
          path: 'delivery-companies/:code/edit',
          name: 'admin-delivery-company-edit',
          component: () => import('../views/AdminDeliveryCompanyFormView.vue'),
          meta: { layout: 'admin', adminRole: 'system', adminTitle: '택배사 수정' },
        },
        {
          path: 'supplier/products',
          name: 'supplier-admin-products',
          component: () => import('../views/AdminProductsView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '상품 관리' },
        },
        {
          path: 'supplier/products/new',
          name: 'supplier-admin-product-new',
          component: () => import('../views/AdminProductFormView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '상품 등록' },
        },
        {
          path: 'supplier/products/:id/edit',
          name: 'supplier-admin-product-edit',
          component: () => import('../views/AdminProductFormView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '상품 수정' },
        },
        {
          path: 'supplier/products/:id',
          name: 'supplier-admin-product-detail',
          component: () => import('../views/AdminProductDetailView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '상품 상세' },
        },
        {
          path: 'supplier/inquiries',
          name: 'supplier-admin-inquiries',
          component: () => import('../views/AdminInquiriesView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '문의 관리' },
        },
        {
          path: 'supplier/notifications',
          name: 'supplier-admin-notifications',
          component: () => import('../views/AdminNotificationsView.vue'),
          meta: { layout: 'admin', adminRole: 'supplier', adminTitle: '알림' },
        },
        {
          path: 'seller/dashboard',
          name: 'seller-admin-dashboard',
          component: () => import('../views/SellerDashboardView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '대시보드' },
        },
        {
          path: 'seller/addresses',
          name: 'seller-admin-addresses',
          component: () => import('../views/SellerAddressesView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '배송지 관리' },
        },
        {
          path: 'seller/payments',
          name: 'seller-admin-payments',
          component: () => import('../views/SellerPaymentsView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '결제·환불' },
        },
        {
          path: 'seller/orders',
          name: 'seller-admin-orders',
          component: () => import('../views/OrdersView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'seller',
            adminTitle: '주문 관리',
            sellerOrders: true,
          },
        },
        {
          path: 'seller/orders/:id',
          name: 'seller-admin-order-detail',
          component: () => import('../views/OrderDetailView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'seller',
            adminTitle: '주문 상세',
            sellerOrders: true,
          },
        },
        {
          path: 'seller/products',
          name: 'seller-admin-products',
          component: () => import('../views/SellerProductBrowseView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '상품 탐색' },
        },
        {
          path: 'seller/products/:id',
          name: 'seller-admin-product-detail',
          component: () => import('../views/ProductDetailView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'seller',
            adminTitle: '상품 상세',
            sellerCatalog: true,
          },
        },
        {
          path: 'seller/cart',
          name: 'seller-admin-cart',
          component: () => import('../views/SellerAdminCartView.vue'),
          meta: {
            layout: 'admin',
            adminRole: 'seller',
            adminTitle: '장바구니',
            sellerAdminCart: true,
          },
        },
        {
          path: 'seller/wishlists',
          name: 'seller-admin-wishlists',
          component: () => import('../views/SellerWishlistsView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '찜 상품' },
        },
        {
          path: 'seller/business',
          name: 'seller-admin-business',
          component: () => import('../views/SellerBusinessView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '사업자·매장 관리' },
        },
        {
          path: 'seller/inquiries',
          name: 'seller-admin-inquiries',
          component: () => import('../views/AdminInquiriesView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '문의 관리' },
        },
        {
          path: 'seller/notifications',
          name: 'seller-admin-notifications',
          component: () => import('../views/AdminNotificationsView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '알림' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.matched.some((record) => record.meta.requiresAuth)) return true

  const authStore = useAuthStore()
  if (!authStore.accessToken) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  try {
    await authStore.getValidAccessToken()
    if (!authStore.user) await authStore.fetchCurrentUser()
    const adminRole = to.meta.adminRole
    if (adminRole && !authStore.canAccessAdminRole(adminRole)) return authStore.adminEntryPath
    return true
  } catch {
    authStore.clear()
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router
