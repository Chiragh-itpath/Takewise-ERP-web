<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { normalizeError } from '@/core/api/errors'
import { toFieldErrors, toFieldErrorsFromApi } from '@/shared/utils/zod'
import { customersApi } from '../customers.api'
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerForm,
} from '../customers.schemas'
import { CUSTOMER_STATUSES, type Customer } from '../customers.types'

// customer = null → "Add" mode, otherwise "Edit" mode
const props = defineProps<{ customer: Customer | null }>()
const visible = defineModel<boolean>('visible', { required: true })
const emit = defineEmits<{ saved: [customer: Customer] }>()

const isEdit = computed(() => props.customer !== null)

const emptyForm = (): CreateCustomerForm => ({
  name: '',
  contactName: '',
  email: '',
  city: '',
  status: 'Active',
})

function toForm(c: Customer): CreateCustomerForm {
  return {
    name: c.name,
    contactName: c.contactName,
    email: c.email,
    city: c.city,
    status: c.status,
  }
}

const form = ref<CreateCustomerForm>(emptyForm())
const saving = ref(false)
const formError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

// Reset the form every time the dialog opens
watch(visible, (open) => {
  if (!open) return
  form.value = props.customer ? toForm(props.customer) : emptyForm()
  formError.value = null
  fieldErrors.value = {}
})

async function submit(request: () => Promise<Customer>) {
  saving.value = true
  try {
    const saved = await request()
    emit('saved', saved)
    visible.value = false
  } catch (e) {
    const apiError = normalizeError(e)
    formError.value = apiError.message
    fieldErrors.value = toFieldErrorsFromApi(apiError.fieldErrors)
  } finally {
    saving.value = false
  }
}

async function save() {
  formError.value = null
  fieldErrors.value = {}

  const customer = props.customer
  if (customer) {
    // Edit: email is not part of the payload (Zod strips it)
    const result = updateCustomerSchema.safeParse(form.value)
    if (!result.success) {
      fieldErrors.value = toFieldErrors(result.error)
      return
    }
    await submit(() => customersApi.update(customer.id, result.data))
  } else {
    const result = createCustomerSchema.safeParse(form.value)
    if (!result.success) {
      fieldErrors.value = toFieldErrors(result.error)
      return
    }
    await submit(() => customersApi.create(result.data))
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="isEdit ? 'Edit customer' : 'Add customer'"
    class="w-[32rem] max-w-[95vw]"
  >
    <form class="flex flex-col gap-4" novalidate @submit.prevent="save">
      <Message v-if="formError" severity="error">{{ formError }}</Message>

      <div class="flex flex-col gap-1.5">
        <label for="customer-name" class="text-sm font-medium">Customer name</label>
        <InputText id="customer-name" v-model="form.name" :invalid="!!fieldErrors.name" fluid />
        <small v-if="fieldErrors.name" class="text-sm text-red-600">{{ fieldErrors.name }}</small>
      </div>

      <div class="grid items-start gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label for="customer-contact" class="text-sm font-medium">Contact name</label>
          <InputText
            id="customer-contact"
            v-model="form.contactName"
            :invalid="!!fieldErrors.contactName"
            fluid
          />
          <small v-if="fieldErrors.contactName" class="text-sm text-red-600">
            {{ fieldErrors.contactName }}
          </small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="customer-email" class="text-sm font-medium">Email</label>
          <InputText
            id="customer-email"
            v-model="form.email"
            type="email"
            :disabled="isEdit"
            :invalid="!!fieldErrors.email"
            fluid
          />
          <small v-if="fieldErrors.email" class="text-sm text-red-600">
            {{ fieldErrors.email }}
          </small>
          <small v-else-if="isEdit" class="inline-flex items-center gap-1 text-xs text-gray-500">
            <i class="pi pi-lock text-[10px]" />
            Email can't be changed
          </small>
        </div>
      </div>

      <div class="grid items-start gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label for="customer-city" class="text-sm font-medium">City</label>
          <InputText id="customer-city" v-model="form.city" :invalid="!!fieldErrors.city" fluid />
          <small v-if="fieldErrors.city" class="text-sm text-red-600">{{ fieldErrors.city }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="customer-status" class="text-sm font-medium">Status</label>
          <Select
            v-model="form.status"
            input-id="customer-status"
            :options="[...CUSTOMER_STATUSES]"
            :invalid="!!fieldErrors.status"
            fluid
          />
          <small v-if="fieldErrors.status" class="text-sm text-red-600">
            {{ fieldErrors.status }}
          </small>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button type="button" label="Cancel" severity="secondary" text @click="visible = false" />
        <Button
          type="submit"
          :label="isEdit ? 'Save changes' : 'Save'"
          icon="pi pi-check"
          :loading="saving"
        />
      </div>
    </form>
  </Dialog>
</template>