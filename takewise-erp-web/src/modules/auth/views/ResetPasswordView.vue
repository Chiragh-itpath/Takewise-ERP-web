<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { authApi } from '@/core/auth/auth.api'
import { normalizeError } from '@/core/api/errors'
import { toFieldErrors, toFieldErrorsFromApi } from '@/shared/utils/zod'
import { resetPasswordSchema } from '../auth.schemas'

const route = useRoute()
const router = useRouter()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

async function submit() {
  error.value = null
  const result = resetPasswordSchema.safeParse({
    password: password.value,
    confirmPassword: confirmPassword.value,
  })
  if (!result.success) {
    fieldErrors.value = toFieldErrors(result.error)
    return
  }
  fieldErrors.value = {}

  loading.value = true
  try {
    await authApi.resetPassword({ token: token.value, password: result.data.password })
    await router.replace({ name: 'login', query: { reason: 'password-reset' } })
  } catch (e) {
    const apiError = normalizeError(e)
    error.value = apiError.message
    fieldErrors.value = toFieldErrorsFromApi(apiError.fieldErrors)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <h1 class="mb-2 text-2xl font-semibold">Set a new password</h1>

  <template v-if="!token">
    <Message severity="error" class="mb-4">
      This reset link is invalid or incomplete.
    </Message>
    <RouterLink
      :to="{ name: 'forgot-password' }"
      class="text-sm font-medium text-indigo-600 hover:underline"
    >
      Request a new reset link
    </RouterLink>
  </template>

  <template v-else>
    <p class="mb-4 text-sm text-gray-600">Choose a new password with at least 8 characters.</p>

    <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>

    <form class="grid gap-4" novalidate @submit.prevent="submit">
      <div class="grid gap-1.5">
        <label for="password" class="text-sm font-medium">New password</label>
        <Password
          v-model="password"
          input-id="password"
          :feedback="false"
          :invalid="!!fieldErrors.password"
          toggle-mask
          fluid
        />
        <small v-if="fieldErrors.password" class="text-sm text-red-600">
          {{ fieldErrors.password }}
        </small>
      </div>

      <div class="grid gap-1.5">
        <label for="confirmPassword" class="text-sm font-medium">Confirm new password</label>
        <Password
          v-model="confirmPassword"
          input-id="confirmPassword"
          :feedback="false"
          :invalid="!!fieldErrors.confirmPassword"
          toggle-mask
          fluid
        />
        <small v-if="fieldErrors.confirmPassword" class="text-sm text-red-600">
          {{ fieldErrors.confirmPassword }}
        </small>
      </div>

      <Button type="submit" label="Reset password" :loading="loading" fluid />
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