<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { normalizeError } from '@/core/api/errors'
import { useAuthStore } from '@/core/auth/auth.store'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { toFieldErrors, toFieldErrorsFromApi } from '@/shared/utils/zod'
import { settingsApi } from '../settings.api'
import { settingsSchema } from '../settings.schemas'
import { CURRENCIES, type CompanySettings } from '../settings.types'

const auth = useAuthStore()
const tenant = useTenantStore()

const form = ref<CompanySettings | null>(null)
const saved = ref<CompanySettings | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const saving = ref(false)
const formError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const successMessage = ref<string | null>(null)

const isDirty = computed(
    () => !!form.value && !!saved.value && JSON.stringify(form.value) !== JSON.stringify(saved.value),
)

onMounted(async () => {
    try {
        const settings = await settingsApi.get()
        saved.value = settings
        form.value = { ...settings }
    } catch (e) {
        loadError.value = normalizeError(e).message
    } finally {
        loading.value = false
    }
})

function reset() {
    if (saved.value) form.value = { ...saved.value }
    fieldErrors.value = {}
    formError.value = null
}

async function save() {
    if (!form.value) return
    formError.value = null
    successMessage.value = null

    const result = settingsSchema.safeParse(form.value)
    if (!result.success) {
        fieldErrors.value = toFieldErrors(result.error)
        return
    }
    fieldErrors.value = {}

    saving.value = true
    try {
        const updated = await settingsApi.update(result.data)
        saved.value = updated
        form.value = { ...updated }

        // Reflect a renamed company in the topbar and company switcher right away
        const current = tenant.current
        if (current && current.name !== updated.companyName) {
            const renamed = { ...current, name: updated.companyName }
            tenant.setTenant(renamed)
            auth.updateTenant(renamed)
        }

        successMessage.value = 'Settings saved.'
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
    <section class="max-w-xl space-y-4">
        <div>
            <h1 class="text-2xl font-semibold">Company settings</h1>
            <p class="mt-1 text-sm text-gray-600">
                These settings apply to <strong>{{ tenant.current?.name }}</strong> only.
            </p>
        </div>

        <p v-if="loading" class="text-sm text-gray-500">Loading settings…</p>
        <Message v-else-if="loadError" severity="error">{{ loadError }}</Message>

        <form v-else-if="form" class="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5" novalidate
            @submit.prevent="save">
            <Message v-if="successMessage" severity="success" :life="3000">
                {{ successMessage }}
            </Message>
            <Message v-if="formError" severity="error">{{ formError }}</Message>

            <div class="flex flex-col gap-1.5">
                <label for="company-name" class="text-sm font-medium">Company name</label>
                <InputText id="company-name" v-model="form.companyName" :invalid="!!fieldErrors.companyName" fluid />
                <small v-if="fieldErrors.companyName" class="text-sm text-red-600">
                    {{ fieldErrors.companyName }}
                </small>
            </div>

            <div class="grid items-start gap-4 sm:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                    <label for="default-currency" class="text-sm font-medium">Default currency</label>
                    <Select v-model="form.defaultCurrency" input-id="default-currency" :options="[...CURRENCIES]"
                        :invalid="!!fieldErrors.defaultCurrency" fluid />
                    <small v-if="fieldErrors.defaultCurrency" class="text-sm text-red-600">
                        {{ fieldErrors.defaultCurrency }}
                    </small>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label for="invoice-prefix" class="text-sm font-medium">Invoice prefix</label>
                    <InputText id="invoice-prefix" v-model="form.invoicePrefix" :invalid="!!fieldErrors.invoicePrefix"
                        maxlength="6" class="uppercase" fluid />
                    <small v-if="fieldErrors.invoicePrefix" class="text-sm text-red-600">
                        {{ fieldErrors.invoicePrefix }}
                    </small>
                    <small v-else class="text-xs text-gray-500">
                        Invoices will be numbered
                        <code
                            class="rounded bg-gray-100 px-1">{{ (form.invoicePrefix || 'INV').toUpperCase() }}-0001</code>,
                        <code
                            class="rounded bg-gray-100 px-1">{{ (form.invoicePrefix || 'INV').toUpperCase() }}-0002</code>,
                        …
                    </small>
                </div>
            </div>

            <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" label="Reset" severity="secondary" text :disabled="!isDirty || saving"
                    @click="reset" />
                <Button type="submit" label="Save settings" icon="pi pi-check" :disabled="!isDirty" :loading="saving" />
            </div>
        </form>
    </section>
</template>