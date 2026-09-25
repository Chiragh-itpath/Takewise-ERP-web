import type { Router } from 'vue-router'
import type { Pinia } from 'pinia'
import { useAuthStore } from './auth.store'
import { useTenantStore } from '@/core/tenant/tenant.store'

export function installAuthGuard(router: Router, pinia: Pinia) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore(pinia)
    const tenant = useTenantStore(pinia)

    await auth.init()
    // Signed-in users don't need the login page
    if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'home' }

    if (!to.meta.requiresAuth) return true

    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // "/" sends the user to their first company
    if (to.name === 'home') {
      const slug = auth.defaultTenantSlug
      return slug ? { name: 'dashboard', params: { tenantSlug: slug } } : { name: 'forbidden' }
    }

    const slug = to.params.tenantSlug
    if (typeof slug === 'string') {
      const membership = auth.membershipFor(slug)
      if (!membership) return { name: 'forbidden' }

      tenant.setTenant(membership.tenant)

      const required = to.meta.permissions ?? []
      if (!required.every((p) => membership.permissions.includes(p))) {
        return { name: 'forbidden' }
      }
    }

    return true
  })
}