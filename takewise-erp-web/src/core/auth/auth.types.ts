import type { Tenant } from '@/core/tenant/tenant.types'

export interface User {
  id: string
  email: string
  fullName: string
}

export interface TenantMembership {
  tenant: Tenant
  roles: string[]
  permissions: string[]
}

export interface MeResponse {
  user: User
  memberships: TenantMembership[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}