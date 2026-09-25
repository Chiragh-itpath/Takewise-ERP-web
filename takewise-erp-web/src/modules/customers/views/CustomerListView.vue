<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { normalizeError } from '@/core/api/errors'
import { useCan } from '@/core/permissions/useCan'
import { toFieldErrors, toFieldErrorsFromApi } from '@/shared/utils/zod'
import { formatDate } from '@/shared/utils/format'
import { customersApi } from '../customers.api'
import { createCustomerSchema, type CreateCustomerForm } from '../customers.schemas'
import { CUSTOMER_STATUSES, type Customer, type CustomerStatus } from '../customers.types'

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

// ---- Add customer dialog ----
const emptyForm = (): CreateCustomerForm => ({
  name: '',
  contactName: '',
  email: '',
  city: '',
  status: 'Active',
})

const dialogVisible = ref(false)
const form = ref<CreateCustomerForm>(emptyForm())
const saving = ref(false)
const formError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

function openDialog() {
  form.value = emptyForm()
  formError.value = null
  fieldErrors.value = {}
  dialogVisible.value = true
}

async function save() {
  formError.value = null
  const result = createCustomerSchema.safeParse(form.value)
  if (!result.success) {
    fieldErrors.value = toFieldErrors(result.error)
    return
  }
  fieldErrors.value = {}

  saving.value = true
  try {
    const created = await customersApi.create(result.data)
    customers.value = [...customers.value, created]
    dialogVisible.value = false
  } catch (e) {
    const apiError = normalizeError(e)
    formError.value = apiError.message
    fieldErrors.value = toFieldErrorsFromApi(apiError.fieldErrors)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">Customers</h1>
      <Button v-if="can('customers.write')" label="Add customer" icon="pi pi-plus" @click="openDialog" />
    </div>

    <Message v-if="error" severity="error">{{ error }}</Message>

    <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <DataTable :value="customers" :loading="loading" data-key="id" striped-rows sort-field="name" :sort-order="1">
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

        <template #empty>No customers found.</template>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" modal header="Add customer" class="w-[32rem] max-w-[95vw]">
      <form class="grid gap-4" novalidate @submit.prevent="save">
        <Message v-if="formError" severity="error">{{ formError }}</Message>

        <div class="grid gap-1.5">
          <label for="customer-name" class="text-sm font-medium">Company name</label>
          <InputText id="customer-name" v-model="form.name" :invalid="!!fieldErrors.name" fluid />
          <small v-if="fieldErrors.name" class="text-sm text-red-600">{{ fieldErrors.name }}</small>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <label for="customer-contact" class="text-sm font-medium">Contact name</label>
            <InputText id="customer-contact" v-model="form.contactName" :invalid="!!fieldErrors.contactName" fluid />
            <small v-if="fieldErrors.contactName" class="text-sm text-red-600">
              {{ fieldErrors.contactName }}
            </small>
          </div>

          <div class="grid gap-1.5">
            <label for="customer-email" class="text-sm font-medium">Email</label>
            <InputText id="customer-email" v-model="form.email" type="email" :invalid="!!fieldErrors.email" fluid />
            <small v-if="fieldErrors.email" class="text-sm text-red-600">
              {{ fieldErrors.email }}
            </small>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <label for="customer-city" class="text-sm font-medium">City</label>
            <InputText id="customer-city" v-model="form.city" :invalid="!!fieldErrors.city" fluid />
            <small v-if="fieldErrors.city" class="text-sm text-red-600">{{ fieldErrors.city }}</small>
          </div>

          <div class="grid gap-1.5">
            <label for="customer-status" class="text-sm font-medium">Status</label>
            <Select v-model="form.status" input-id="customer-status" :options="[...CUSTOMER_STATUSES]"
              :invalid="!!fieldErrors.status" fluid />
            <small v-if="fieldErrors.status" class="text-sm text-red-600">
              {{ fieldErrors.status }}
            </small>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button type="button" label="Cancel" severity="secondary" text @click="dialogVisible = false" />
          <Button type="submit" label="Save" icon="pi pi-check" :loading="saving" />
        </div>
      </form>
    </Dialog>
  </section>
</template>