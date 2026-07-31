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
          path: 'seller/products',
          name: 'seller-admin-products',
          component: () => import('../views/AdminProductsView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '상품 관리' },
        },
        {
          path: 'seller/products/:id',
          name: 'seller-admin-product-detail',
          component: () => import('../views/AdminProductDetailView.vue'),
          meta: { layout: 'admin', adminRole: 'seller', adminTitle: '상품 상세' },
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
    return true
  } catch {
    authStore.clear()
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router
