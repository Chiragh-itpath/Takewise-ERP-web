import type { App } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { router } from './router'
import { configureApiClient } from '@/core/api/client'
import { authApi } from '@/core/auth/auth.api'
import { useAuthStore } from '@/core/auth/auth.store'
import { installAuthGuard } from '@/core/auth/auth.guard'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { definePreset } from '@primeuix/themes'


const TakewisePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
  },
})
export function registerPlugins(app: App) {
  configureApiClient({ refreshSession: authApi.refresh })

  const pinia = createPinia()
  app.use(pinia)

  configureApiClient({
    refreshSession: authApi.refresh,
    getTenantId: () => useTenantStore(pinia).currentId,
    // Only react when a live session expires; the initial load is handled by the guard
    onUnauthorized: () => {
      if (useAuthStore(pinia).isAuthenticated) {
        window.location.assign('/login?reason=expired')
      }
    },
  })

  installAuthGuard(router, pinia)

  app.use(router)

  app.use(PrimeVue, {
    theme: {
      preset: TakewisePreset,
      // Dark mode only when .app-dark is on <html>, not tied to OS setting
      options: {
        darkModeSelector: '.app-dark',
        cssLayer: { name: 'primevue', order: 'theme, base, primevue' },
      },
    },
  })
}