<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '@/core/auth/auth.store'
import { normalizeError } from '@/core/api/errors'
import { toFieldErrors } from '@/shared/utils/zod'
import { loginSchema } from '../auth.schemas'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

// Only allow internal redirects (prevents open-redirect attacks)
function safeRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/'
}

async function submit() {
  error.value = null
  const result = loginSchema.safeParse({ email: email.value, password: password.value })
  if (!result.success) {
    fieldErrors.value = toFieldErrors(result.error)
    return
  }
  fieldErrors.value = {}

  loading.value = true
  try {
    await auth.login(result.data)
    await router.replace(safeRedirect(route.query.redirect))
  } catch (e) {
    error.value = normalizeError(e).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <h1 class="mb-4 text-2xl font-semibold">Sign in</h1>

  <Message v-if="route.query.reason === 'expired'" severity="warn" class="mb-4">
    Your session expired. Please sign in again.
  </Message>
  <Message v-if="route.query.reason === 'password-reset'" severity="success" class="mb-4">
    Your password has been reset. Please sign in with your new password.
  </Message>
  <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>

  <form class="grid gap-4" novalidate @submit.prevent="submit">
    <div class="grid gap-1.5">
      <label for="email" class="text-sm font-medium">Email</label>
      <InputText id="email" v-model="email" type="email" :invalid="!!fieldErrors.email" fluid />
      <small v-if="fieldErrors.email" class="text-sm text-red-600">{{ fieldErrors.email }}</small>
    </div>

    <div class="grid gap-1.5">
      <label for="password" class="text-sm font-medium">Password</label>
      <Password v-model="password" input-id="password" :feedback="false" :invalid="!!fieldErrors.password" toggle-mask
        fluid />
      <small v-if="fieldErrors.password" class="text-sm text-red-600">
        {{ fieldErrors.password }}
      </small>
    </div>

    <Button type="submit" label="Sign in" :loading="loading" fluid />

    <RouterLink :to="{ name: 'forgot-password' }" class="text-center text-sm text-indigo-600 hover:underline">
      Forgot password?
    </RouterLink>
  </form>
</template>