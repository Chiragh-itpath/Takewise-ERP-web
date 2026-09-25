import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/core/config/env'
import { normalizeError } from './errors'

export const TENANT_HEADER = 'X-Tenant-ID'

// Auth endpoints never trigger the refresh-and-retry flow
const AUTH_URLS = [
  '/auth/login',
  '/auth/logout',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
]

interface ApiClientHooks {
  getTenantId: () => string | null
  refreshSession: () => Promise<void>
  onUnauthorized: () => void
  onForbidden: () => void
}

const hooks: ApiClientHooks = {
  getTenantId: () => null,
  refreshSession: () => Promise.reject(new Error('refreshSession not configured')),
  onUnauthorized: () => {},
  onForbidden: () => {},
}

export function configureApiClient(overrides: Partial<ApiClientHooks>) {
  Object.assign(hooks, overrides)
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true, // server manages the session via httpOnly cookies
  timeout: 15000,
  headers: { Accept: 'application/json' },
})

// Request: attach the active tenant (the server still enforces isolation)
apiClient.interceptors.request.use((config) => {
  const tenantId = hooks.getTenantId()
  if (tenantId) config.headers.set(TENANT_HEADER, tenantId)
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// Shared promise so parallel 401s trigger only one refresh
let refreshPromise: Promise<void> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint = AUTH_URLS.some((u) => original?.url?.includes(u))

    if (status === 401 && original && !isAuthEndpoint) {
      if (!original._retry) {
        original._retry = true
        try {
          refreshPromise ??= hooks.refreshSession().finally(() => {
            refreshPromise = null
          })
          await refreshPromise
          return apiClient(original)
        } catch {
          hooks.onUnauthorized()
          return Promise.reject(normalizeError(error))
        }
      }
      hooks.onUnauthorized()
    }

    if (status === 403) hooks.onForbidden()

    return Promise.reject(normalizeError(error))
  },
)