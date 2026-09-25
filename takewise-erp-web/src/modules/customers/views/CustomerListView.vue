<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { normalizeError } from '@/core/api/errors'
import { useCan } from '@/core/permissions/useCan'
import { formatDate } from '@/shared/utils/format'
import { customersApi } from '../customers.api'
import type { Customer, CustomerStatus } from '../customers.types'
import CustomerFormDialog from '../components/CustomerFormDialog.vue'

const { can } = useCan()

// ---- List ----
const customers = ref<Customer[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    customers.value = await customersApi.list()
  } catch (e) {
    error.value = normalizeError(e).message
  } finally {
    loading.value = false
  }
}

onMounted(load)

function statusSeverity(status: CustomerStatus) {
  return status === 'Active' ? 'success' : 'warn'
}

// ---- Add / edit dialog ----
const dialogVisible = ref(false)
const editing = ref<Customer | null>(null)

function openCreate() {
  editing.value = null
  dialogVisible.value = true
}

function openEdit(customer: Customer) {
  editing.value = customer
  dialogVisible.value = true
}

function onSaved(saved: Customer) {
  const exists = customers.value.some((c) => c.id === saved.id)
  customers.value = exists
    ? customers.value.map((c) => (c.id === saved.id ? saved : c))
    : [...customers.value, saved]
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">Customers</h1>
      <Button
        v-if="can('customers.write')"
        label="Add customer"
        icon="pi pi-plus"
        @click="openCreate"
      />
    </div>

    <Message v-if="error" severity="error">{{ error }}</Message>

    <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <DataTable
        :value="customers"
        :loading="loading"
        data-key="id"
        striped-rows
        sort-field="name"
        :sort-order="1"
      >
        <Column field="name" header="Name" sortable />

        <Column field="contactName" header="Contact" sortable>
          <template #body="{ data }">
            <div class="flex flex-col">
              <span>{{ data.contactName }}</span>
              <a :href="`mailto:${data.email}`" class="text-xs text-indigo-600 hover:underline">
                {{ data.email }}
              </a>
            </div>
          </template>
        </Column>

        <Column field="city" header="City" sortable />

        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <Tag :value="data.status" :severity="statusSeverity(data.status)" />
          </template>
        </Column>

        <Column field="joinedAt" header="Joined" sortable>
          <template #body="{ data }">
            {{ formatDate(data.joinedAt) }}
          </template>
        </Column>

        <Column v-if="can('customers.write')" header="Actions" class="w-24 text-right">
          <template #body="{ data }">
            <Button
              icon="pi pi-pencil"
              text
              rounded
              severity="secondary"
              :aria-label="`Edit ${data.name}`"
              @click="openEdit(data)"
            />
          </template>
        </Column>

        <template #empty>No customers found.</template>
      </DataTable>
    </div>

    <CustomerFormDialog v-model:visible="dialogVisible" :customer="editing" @saved="onSaved" />
  </section>
</template>