import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Auth (public)
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: { guestOnly: true, layout: 'auth' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/modules/auth/views/ForgotPasswordView.vue'),
    meta: { guestOnly: true, layout: 'auth' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/modules/auth/views/ResetPasswordView.vue'),
    meta: { guestOnly: true, layout: 'auth' },
  },

  // Entry point: the guard redirects to the user's default tenant
  {
    path: '/',
    name: 'home',
    component: { render: () => null },
    meta: { requiresAuth: true },
  },

  // Tenant-scoped app
  {
    path: '/t/:tenantSlug',
    meta: { requiresAuth: true, layout: 'app' },
    children: [
      // Dashboard
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/views/DashboardView.vue'),
      },
      // Customers
      {
        path: 'customers',
        name: 'customers',
        component: () => import('@/modules/customers/views/CustomerListView.vue'),
        meta: { permissions: ['customers.read'] },
      },
    ],
  },

  // Errors
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/modules/errors/views/ForbiddenView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/modules/errors/views/NotFoundView.vue'),
    meta: { layout: 'auth' },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})