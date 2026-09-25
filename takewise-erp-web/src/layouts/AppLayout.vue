<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { env } from '@/core/config/env'
import { useAuthStore } from '@/core/auth/auth.store'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { useCan } from '@/core/permissions/useCan'

interface NavItem {
  label: string
  icon: string
  to: RouteLocationRaw
  permission?: string
}

const auth = useAuthStore()
const tenant = useTenantStore()
const { can } = useCan()
const router = useRouter()

const tenantOptions = computed(() => auth.memberships.map((m) => m.tenant))

// Add new screens here; items are hidden when the user lacks the permission
const navItems = computed<NavItem[]>(() => {
  const tenantSlug = tenant.current?.slug ?? ''
  const items: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', to: { name: 'dashboard', params: { tenantSlug } } },
    {
      label: 'Customers',
      icon: 'pi pi-users',
      to: { name: 'customers', params: { tenantSlug } },
      permission: 'customers.read',
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      to: { name: 'settings', params: { tenantSlug } },
      permission: 'settings.manage',
    },
  ]
  return items.filter((i) => !i.permission || can(i.permission))
})

function onTenantChange(value: unknown) {
  if (typeof value === 'string' && value !== tenant.current?.slug) {
    router.push({ name: 'dashboard', params: { tenantSlug: value } })
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="flex items-center gap-4 px-4 py-2 border-b border-gray-200 bg-white">
      <strong class="text-indigo-600">{{ env.appName }}</strong>

      <Select v-if="tenantOptions.length > 1" :model-value="tenant.current?.slug" :options="tenantOptions"
        option-label="name" option-value="slug" aria-label="Switch company" @update:model-value="onTenantChange" />
      <span v-else>{{ tenant.current?.name }}</span>

      <span class="flex-1" />
      <span class="hidden md:inline">{{ auth.user?.fullName }}</span>
      <Button label="Log out" icon="pi pi-sign-out" text @click="auth.logout()" />
    </header>

    <div class="flex-1 flex flex-col md:flex-row">
      <nav class="
          flex flex-row overflow-x-auto border-b border-gray-200
          md:flex-col md:w-[220px] md:border-b-0 md:border-r md:border-gray-200
          gap-1 p-2 bg-gray-50
        ">
        <RouterLink v-for="item in navItems" :key="item.label" :to="item.to"
          class="flex items-center gap-2 px-3 py-2 rounded-md no-underline text-inherit hover:bg-indigo-50"
          exact-active-class="bg-indigo-100 font-semibold">
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <main class="flex-1 p-6 min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>