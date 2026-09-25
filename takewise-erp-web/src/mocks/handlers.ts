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
} from '@/modules/customers/customers.types'
import { customers as seedCustomers, users, type MockCustomer, type MockUser } from './data'
import { MOCK_RESET_TOKEN } from './constants'

const api = (path: string) => `${env.apiBaseUrl}${path}`

// ---- Mock-only browser storage (stands in for server-side state) ----
const SESSION_KEY = 'takewise-mock-session' // simulates the httpOnly session cookie
const RESET_KEY = 'takewise-mock-reset-user' // user who requested a reset
const PASSWORDS_KEY = 'takewise-mock-passwords' // changed passwords
const CUSTOMERS_KEY = 'takewise-mock-customers' // customers incl. newly added ones

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
    memberships: user.memberships,
  }
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

  // ---- Customers (tenant-scoped; demonstrates isolation + permissions) ----
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

    const body = await request.json()
    const name = body.name?.trim() ?? ''
    const contactName = body.contactName?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const city = body.city?.trim() ?? ''
    const status = body.status

    // Server-side validation (never trust the client)
    const errors: Record<string, string[]> = {}
    if (!name) errors.name = ['Name is required']
    if (!contactName) errors.contactName = ['Contact name is required']
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Enter a valid email']
    if (!city) errors.city = ['City is required']
    if (!(CUSTOMER_STATUSES as readonly string[]).includes(status)) {
      errors.status = ['Select a status']
    }
    if (Object.keys(errors).length) {
      return HttpResponse.json(
        { message: 'Please fix the highlighted fields', errors },
        { status: 422 },
      )
    }

    const customer: MockCustomer = {
      id: `c-${crypto.randomUUID()}`,
      tenantId: membership.tenant.id, // server-resolved tenant, never client input
      name,
      contactName,
      email,
      city,
      status,
      joinedAt: new Date().toISOString(), // set by the server
    }
    saveCustomers([...getCustomers(), customer])

    return HttpResponse.json(customer, { status: 201 })
  }),
]