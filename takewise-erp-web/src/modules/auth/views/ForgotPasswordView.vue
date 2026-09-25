<script setup lang="ts">
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { authApi } from '@/core/auth/auth.api'
import { normalizeError } from '@/core/api/errors'
import { env } from '@/core/config/env'
import { MOCK_RESET_TOKEN } from '@/mocks/constants'
import { toFieldErrors } from '@/shared/utils/zod'
import { forgotPasswordSchema } from '../auth.schemas'

const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const sentTo = ref<string | null>(null)

async function submit() {
  error.value = null
  const result = forgotPasswordSchema.safeParse({ email: email.value })
  if (!result.success) {
    fieldErrors.value = toFieldErrors(result.error)
    return
  }
  fieldErrors.value = {}

  loading.value = true
  try {
    await authApi.forgotPassword(result.data)
    sentTo.value = result.data.email
  } catch (e) {
    error.value = normalizeError(e).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <h1 class="mb-2 text-2xl font-semibold">Forgot password</h1>

  <template v-if="sentTo">
    <Message severity="success" class="mb-4">
      If an account exists for <strong>{{ sentTo }}</strong>, we've sent a link to reset your
      password.
    </Message>

    <p v-if="env.useMocks" class="mb-2 text-sm text-gray-600">
      Mock mode: no email is sent.
      <RouterLink
        :to="{ name: 'reset-password', query: { token: MOCK_RESET_TOKEN } }"
        class="font-medium text-indigo-600 hover:underline"
      >
        Open the reset link
      </RouterLink>
    </p>
  </template>

  <template v-else>
    <p class="mb-4 text-sm text-gray-600">
      Enter your email and we'll send you a link to reset your password.
    </p>

    <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>

    <form class="grid gap-4" novalidate @submit.prevent="submit">
      <div class="grid gap-1.5">
        <label for="email" class="text-sm font-medium">Email</label>
        <InputText id="email" v-model="email" type="email" :invalid="!!fieldErrors.email" fluid />
        <small v-if="fieldErrors.email" class="text-sm text-red-600">{{ fieldErrors.email }}</small>
      </div>

      <Button type="submit" label="Send reset link" :loading="loading" fluid />
    </form>
  </template>

  <RouterLink
    :to="{ name: 'login' }"
    class="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
  >
    <i class="pi pi-arrow-left text-xs" />
    Back to sign in
  </RouterLink>
</template>