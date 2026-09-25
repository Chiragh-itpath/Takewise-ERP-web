<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/core/auth/auth.store'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { useCan } from '@/core/permissions/useCan'

interface QuickLink {
  label: string
  description: string
  icon: string
  to: RouteLocationRaw
  permission: string
}

const auth = useAuthStore()
const tenant = useTenantStore()
const { can, permissions } = useCan()

// Only links the user is allowed to open are shown
const quickLinks = computed<QuickLink[]>(() => {
  const tenantSlug = tenant.current?.slug ?? ''
  const links: QuickLink[] = [
    {
      label: 'Customers',
      description: 'View and manage customers for this company',
      icon: 'pi pi-users',
      to: { name: 'customers', params: { tenantSlug } },
      permission: 'customers.read',
    },
    {
      label: 'Company settings',
      description: 'Company name, default currency and invoice prefix',
      icon: 'pi pi-cog',
      to: { name: 'settings', params: { tenantSlug } },
      permission: 'settings.manage',
    },
  ]
  return links.filter((link) => can(link.permission))
})
</script>

<template>
  <section class="space-y-6">
    <h1 class="text-2xl font-semibold">Welcome, {{ auth.user?.fullName }}</h1>

    <div class="space-y-3 rounded-lg border border-gray-200 bg-white p-4 text-sm">
      <p>Company: <strong>{{ tenant.current?.name }}</strong></p>
      <div class="flex flex-wrap items-center gap-2">
        <span>Your permissions:</span>
        <span
          v-for="p in permissions"
          :key="p"
          class="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
        >
          {{ p }}
        </span>
        <span v-if="!permissions.length" class="text-gray-500">none</span>
      </div>
    </div>

    <div v-if="quickLinks.length" class="space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Quick links</h2>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="link in quickLinks"
          :key="link.label"
          :to="link.to"
          class="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
          >
            <i :class="link.icon" />
          </span>
          <span class="flex flex-col">
            <span class="font-medium text-gray-900 group-hover:text-indigo-700">
              {{ link.label }}
            </span>
            <span class="text-sm text-gray-500">{{ link.description }}</span>
          </span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>