import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from './auth.api'
import type { LoginRequest, MeResponse, TenantMembership, User } from './auth.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const memberships = ref<TenantMembership[]>([])
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const defaultTenantSlug = computed(() => memberships.value[0]?.tenant.slug ?? null)

  function setSession(me: MeResponse) {
    user.value = me.user
    memberships.value = me.memberships
  }

  // Restores the session on page load (cookie-based, so we just ask the server)
  async function init() {
  if (initialized.value) return
  console.log('[auth] init called') // temporary
  try {
    setSession(await authApi.me())
  } catch {
    // Not signed in
  } finally {
    initialized.value = true
  }
}

  async function login(payload: LoginRequest) {
    setSession(await authApi.login(payload))
    initialized.value = true
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      window.location.assign('/login') // full reload clears all state
    }
  }

  function membershipFor(slug: string): TenantMembership | null {
    return memberships.value.find((m) => m.tenant.slug === slug) ?? null
  }

  return {
    user,
    memberships,
    initialized,
    isAuthenticated,
    defaultTenantSlug,
    init,
    login,
    logout,
    membershipFor,
  }
})