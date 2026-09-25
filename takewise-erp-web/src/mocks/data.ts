import type { Tenant } from '@/core/tenant/tenant.types'
import type { TenantMembership, User } from '@/core/auth/auth.types'
import type { Customer } from '@/modules/customers/customers.types'

// ---- Tenants (fake companies) ----
const acme: Tenant = { id: 't-acme', slug: 'acme', name: 'Acme Manufacturing (demo)' }
const globex: Tenant = { id: 't-globex', slug: 'globex', name: 'Globex Trading (demo)' }

export const tenants: Tenant[] = [acme, globex]

// ---- Users (FAKE demo credentials, mock-only) ----
export interface MockUser extends User {
  password: string
  memberships: TenantMembership[]
}

export const DEMO_PASSWORD = 'Demo@123'

export const users: MockUser[] = [
  {
    id: 'u-admin',
    email: 'admin@demo.test',
    fullName: 'Demo Admin',
    password: DEMO_PASSWORD,
    memberships: [
      {
        tenant: acme,
        roles: ['admin'],
        permissions: ['customers.read', 'customers.write', 'settings.manage'],
      },
      { tenant: globex, roles: ['viewer'], permissions: ['customers.read'] },
    ],
  },
  {
    id: 'u-viewer',
    email: 'viewer@demo.test',
    fullName: 'Demo Viewer',
    password: DEMO_PASSWORD,
    memberships: [{ tenant: acme, roles: ['viewer'], permissions: ['customers.read'] }],
  },
]

// ---- Tenant-scoped sample records ----
export interface MockCustomer {
  id: string
  tenantId: string
  name: string
  city: string
  contactName: string
  email: string
  status: 'Active' | 'On hold'
  joinedAt: string
}

export const customers: MockCustomer[] = [
  {
    id: 'c-1',
    tenantId: acme.id,
    name: 'Northwind Parts',
    city: 'Amsterdam',
    contactName: 'Sophie de Vries',
    email: 'sophie@northwind.test',
    status: 'Active',
    joinedAt: '2024-02-14',
  },
  {
    id: 'c-2',
    tenantId: acme.id,
    name: 'Blue Harbor Logistics',
    city: 'Rotterdam',
    contactName: 'Marcus Jansen',
    email: 'marcus@blueharbor.test',
    status: 'Active',
    joinedAt: '2023-11-02',
  },
  {
    id: 'c-3',
    tenantId: acme.id,
    name: 'Keystone Industrial Supply',
    city: 'Utrecht',
    contactName: 'Elise Bakker',
    email: 'elise@keystone.test',
    status: 'On hold',
    joinedAt: '2022-08-19',
  },
  {
    id: 'c-4',
    tenantId: acme.id,
    name: 'Marlow Engineering',
    city: 'The Hague',
    contactName: 'Thomas Smit',
    email: 'thomas@marlow.test',
    status: 'Active',
    joinedAt: '2024-06-27',
  },
  {
    id: 'c-5',
    tenantId: globex.id,
    name: 'Sunrise Imports',
    city: 'Eindhoven',
    contactName: 'Nina Vermeer',
    email: 'nina@sunriseimports.test',
    status: 'Active',
    joinedAt: '2023-04-11',
  },
  {
    id: 'c-6',
    tenantId: globex.id,
    name: 'Delta Freight Partners',
    city: 'Tilburg',
    contactName: 'Owen Meijer',
    email: 'owen@deltafreight.test',
    status: 'Active',
    joinedAt: '2024-01-30',
  },
  {
    id: 'c-7',
    tenantId: globex.id,
    name: 'Cedar & Stone Retail',
    city: 'Breda',
    contactName: 'Lotte Vos',
    email: 'lotte@cedarstone.test',
    status: 'On hold',
    joinedAt: '2022-12-05',
  },
]