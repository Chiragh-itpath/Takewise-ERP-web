<script setup lang="ts">
import { useAuthStore } from '@/core/auth/auth.store'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { useCan } from '@/core/permissions/useCan'

const auth = useAuthStore()
const tenant = useTenantStore()
const { can, permissions } = useCan()
</script>

<template>
  <section class="space-y-4">
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

    <p
      v-if="can('settings.manage')"
      class="inline-flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700"
    >
      <i class="pi pi-check-circle" /> You can manage settings (admin only)
    </p>
  </section>
</template>