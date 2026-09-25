import { delay, http, HttpResponse } from 'msw'
import { env } from '@/core/config/env'
import { TENANT_HEADER } from '@/core/api/client'
import type {
  ForgotPasswordRequest,
  LoginRequest,
  MeResponse,
  ResetPasswordRequest,
} from '@/core/auth/auth.types'
import {
  CUSTOMER_STATUSES,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
} from '@/modules/customers/customers.types'
import type { Tenant } from '@/core/tenant/tenant.types'
import { customers as seedCustomers, users, type MockCustomer, type MockUser } from './data'
import { CURRENCIES, type CompanySettings } from '@/modules/settings/settings.types'
import { MOCK_RESET_TOKEN } from './constants'

const api = (path: string) => `${env.apiBaseUrl}${path}`

// ---- Mock-only browser storage (stands in for server-side state) ----
const SESSION_KEY = 'takewise-mock-session' // simulates the httpOnly session cookie
const RESET_KEY = 'takewise-mock-reset-user' // user who requested a reset
const PASSWORDS_KEY = 'takewise-mock-passwords' // changed passwords
const CUSTOMERS_KEY = 'takewise-mock-customers' // customers incl. newly added ones
const SETTINGS_KEY = 'takewise-mock-settings'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function getSessionUser(): MockUser | null {
  const id = sessionStorage.getItem(SESSION_KEY)
  return users.find((u) => u.id === id) ?? null
}

function passwordFor(user: MockUser): string {
  return readJson<Record<string, string>>(PASSWORDS_KEY, {})[user.id] ?? user.password
}

function setPassword(userId: string, password: string) {
  const overrides = readJson<Record<string, string>>(PASSWORDS_KEY, {})
  overrides[userId] = password
  sessionStorage.setItem(PASSWORDS_KEY, JSON.stringify(overrides))
}

function getCustomers(): MockCustomer[] {
  return readJson<MockCustomer[]>(CUSTOMERS_KEY, seedCustomers)
}

function saveCustomers(list: MockCustomer[]) {
  sessionStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list))
}

function toMe(user: MockUser): MeResponse {
  return {
    user: { id: user.id, email: user.email, fullName: user.fullName },
    // Company names come from settings, so renames are reflected everywhere
    memberships: user.memberships.map((m) => ({
      ...m,
      tenant: { ...m.tenant, name: getSettings(m.tenant).companyName },
    })),
  }
}

function defaultSettings(tenant: Tenant): CompanySettings {
  return {
    companyName: tenant.name,
    defaultCurrency: 'EUR',
    invoicePrefix: tenant.slug.slice(0, 3).toUpperCase(),
  }
}

function getSettings(tenant: Tenant): CompanySettings {
  return readJson<Record<string, CompanySettings>>(SETTINGS_KEY, {})[tenant.id] ?? defaultSettings(tenant)
}

function saveSettings(tenantId: string, settings: CompanySettings) {
  const all = readJson<Record<string, CompanySettings>>(SETTINGS_KEY, {})
  all[tenantId] = settings
  sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(all))
}

const noContent = () => new HttpResponse(null, { status: 204 })
const unauthorized = () => HttpResponse.json({ message: 'Not authenticated' }, { status: 401 })
const forbidden = (message = 'Access denied') => HttpResponse.json({ message }, { status: 403 })

export const handlers = [
  // ---- Auth ----
  http.post<never, LoginRequest>(api('/auth/login'), async ({ request }) => {
    await delay(400)
    const { email, password } = await request.json()
    const user = users.find(
      (u) => u.email === email?.trim().toLowerCase() && passwordFor(u) === password,
    )
    if (!user) {
      return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }
    sessionStorage.setItem(SESSION_KEY, user.id)
    return HttpResponse.json(toMe(user))
  }),

  http.post(api('/auth/logout'), () => {
    sessionStorage.removeItem(SESSION_KEY)
    return noContent()
  }),

  http.get(api('/auth/me'), () => {
    const user = getSessionUser()
    return user ? HttpResponse.json(toMe(user)) : unauthorized()
  }),

  http.post(api('/auth/refresh'), () => (getSessionUser() ? noContent() : unauthorized())),

  // ---- Password reset ----
  http.post<never, ForgotPasswordRequest>(api('/auth/forgot-password'), async ({ request }) => {
    await delay(400)
    const { email } = await request.json()
    const user = users.find((u) => u.email === email?.trim().toLowerCase())
    if (user) sessionStorage.setItem(RESET_KEY, user.id)
    // Always 204: never reveal whether an account exists
    return noContent()
  }),

  http.post<never, ResetPasswordRequest>(api('/auth/reset-password'), async ({ request }) => {
    await delay(400)
    const { token, password } = await request.json()
    const user = users.find((u) => u.id === sessionStorage.getItem(RESET_KEY))

    if (token !== MOCK_RESET_TOKEN || !user) {
      return HttpResponse.json(
        { message: 'This reset link is invalid or has expired.' },
        { status: 400 },
      )
    }

    setPassword(user.id, password)
    sessionStorage.removeItem(RESET_KEY)
    return noContent()
  }),

  http.get(api('/customers'), ({ request }) => {
    const user = getSessionUser()
    if (!user) return unauthorized()

    const tenantId = request.headers.get(TENANT_HEADER)
    const membership = user.memberships.find((m) => m.tenant.id === tenantId)

    if (!membership) return forbidden('You do not have access to this company')
    if (!membership.permissions.includes('customers.read')) return forbidden()

    return HttpResponse.json(getCustomers().filter((c) => c.tenantId === membership.tenant.id))
  }),

  http.post<never, CreateCustomerRequest>(api('/customers'), async ({ request }) => {
    await delay(400)
    const user = getSessionUser()
    if (!user) return unauthorized()

    const tenantId = request.headers.get(TENANT_HEADER)
    const membership = user.memberships.find((m) => m.tenant.id === tenantId)

    if (!membership) return forbidden('You do not have access to this company')
    if (!membership.permissions.includes('customers.write')) {
      return forbidden('You do not have permission to add customers')
    }

    const result = validateCreate(await request.json())
    if (!result.ok) {
      return HttpResponse.json(
        { message: 'Please fix the highlighted fields', errors: result.errors },
        { status: 422 },
      )
    }

    const customer: MockCustomer = {
      id: `c-${crypto.randomUUID()}`,
      tenantId: membership.tenant.id, // server-resolved tenant, never client input
      ...result.data,
      joinedAt: new Date().toISOString(), // set by the server
    }
    saveCustomers([...getCustomers(), customer])

    return HttpResponse.json(customer, { status: 201 })
  }),

  http.put<{ id: string }, UpdateCustomerRequest>(
    api('/customers/:id'),
    async ({ request, params }) => {
      await delay(400)
      const user = getSessionUser()
      if (!user) return unauthorized()

      const tenantId = request.headers.get(TENANT_HEADER)
      const membership = user.memberships.find((m) => m.tenant.id === tenantId)

      if (!membership) return forbidden('You do not have access to this company')
      if (!membership.permissions.includes('customers.write')) {
        return forbidden('You do not have permission to edit customers')
      }

      const list = getCustomers()
      // Scoped to the active tenant: another company's customer is simply "not found"
      const existing = list.find((c) => c.id === params.id && c.tenantId === membership.tenant.id)
      if (!existing) {
        return HttpResponse.json({ message: 'Customer not found' }, { status: 404 })
      }

      const result = validateUpdate(await request.json())
      if (!result.ok) {
        return HttpResponse.json(
          { message: 'Please fix the highlighted fields', errors: result.errors },
          { status: 422 },
        )
      }

      // id, tenantId and joinedAt can never be changed by the client
      const updated: MockCustomer = { ...existing, ...result.data }
      saveCustomers(list.map((c) => (c.id === existing.id ? updated : c)))

      return HttpResponse.json(updated)
    },
  ),
  // ---- Company settings (needs settings.manage) ----
  http.get(api('/settings'), ({ request }) => {
    const user = getSessionUser()
    if (!user) return unauthorized()

    const tenantId = request.headers.get(TENANT_HEADER)
    const membership = user.memberships.find((m) => m.tenant.id === tenantId)

    if (!membership) return forbidden('You do not have access to this company')
    if (!membership.permissions.includes('settings.manage')) {
      return forbidden('You do not have permission to manage settings')
    }

    return HttpResponse.json(getSettings(membership.tenant))
  }),

  http.put<never, CompanySettings>(api('/settings'), async ({ request }) => {
    await delay(400)
    const user = getSessionUser()
    if (!user) return unauthorized()

    const tenantId = request.headers.get(TENANT_HEADER)
    const membership = user.memberships.find((m) => m.tenant.id === tenantId)

    if (!membership) return forbidden('You do not have access to this company')
    if (!membership.permissions.includes('settings.manage')) {
      return forbidden('You do not have permission to manage settings')
    }

    const result = validateSettings(await request.json())
    if (!result.ok) {
      return HttpResponse.json(
        { message: 'Please fix the highlighted fields', errors: result.errors },
        { status: 422 },
      )
    }

    saveSettings(membership.tenant.id, result.data)
    return HttpResponse.json(result.data)
  }),
]

// ---- Server-side validation (never trust the client) ----
type FieldErrors = Record<string, string[]>
type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Fields that can be set on create AND changed on update
function validateDetails(
  body: Partial<UpdateCustomerRequest>,
  errors: FieldErrors,
): UpdateCustomerRequest | null {
  const name = body.name?.trim() ?? ''
  const contactName = body.contactName?.trim() ?? ''
  const city = body.city?.trim() ?? ''
  const status = body.status
  const validStatus = !!status && (CUSTOMER_STATUSES as readonly string[]).includes(status)

  if (!name) errors.name = ['Name is required']
  if (!contactName) errors.contactName = ['Contact name is required']
  if (!city) errors.city = ['City is required']
  if (!validStatus) errors.status = ['Select a status']

  if (!name || !contactName || !city || !status || !validStatus) return null
  return { name, contactName, city, status }
}

function validateCreate(body: Partial<CreateCustomerRequest>): ValidationResult<CreateCustomerRequest> {
  const errors: FieldErrors = {}
  const details = validateDetails(body, errors)

  const email = body.email?.trim().toLowerCase() ?? ''
  if (!EMAIL_PATTERN.test(email)) errors.email = ['Enter a valid email']

  if (!details || errors.email) return { ok: false, errors }
  return { ok: true, data: { ...details, email } }
}

function validateUpdate(
  body: Partial<UpdateCustomerRequest> & { email?: unknown },
): ValidationResult<UpdateCustomerRequest> {
  const errors: FieldErrors = {}

  // Email is a fixed identifier once the customer exists
  if (body.email !== undefined) errors.email = ['Email cannot be changed']

  const details = validateDetails(body, errors)
  if (!details || errors.email) return { ok: false, errors }
  return { ok: true, data: details }
}
function validateSettings(body: Partial<CompanySettings>): ValidationResult<CompanySettings> {
  const errors: FieldErrors = {}
  const companyName = body.companyName?.trim() ?? ''
  const invoicePrefix = body.invoicePrefix?.trim().toUpperCase() ?? ''
  const currency = body.defaultCurrency
  const validCurrency = !!currency && (CURRENCIES as readonly string[]).includes(currency)

  if (!companyName) errors.companyName = ['Company name is required']
  if (!validCurrency) errors.defaultCurrency = ['Select a currency']
  if (!/^[A-Z]{2,6}$/.test(invoicePrefix)) {
    errors.invoicePrefix = ['Use 2–6 letters (A–Z)']
  }

  if (Object.keys(errors).length || !currency) return { ok: false, errors }
  return { ok: true, data: { companyName, defaultCurrency: currency, invoicePrefix } }
}