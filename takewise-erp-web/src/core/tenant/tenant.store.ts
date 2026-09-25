import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Tenant } from './tenant.types'

export const useTenantStore = defineStore('tenant', () => {
  const current = ref<Tenant | null>(null)
  const currentId = computed(() => current.value?.id ?? null)

  function setTenant(tenant: Tenant) {
    current.value = tenant
  }

  return { current, currentId, setTenant }
})