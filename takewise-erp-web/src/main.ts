import { createApp } from 'vue'
import App from './App.vue'
import { registerPlugins } from '@/app/plugins'
import { env } from '@/core/config/env'

import 'primeicons/primeicons.css'
import '@/shared/styles/main.css'

async function enableMocking() {
  if (!env.useMocks) return
  // Dynamic import: MSW is never bundled when mocks are off
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  const app = createApp(App)
  registerPlugins(app)
  app.mount('#app')
})