import { z } from 'zod'
import { CUSTOMER_STATUSES } from './customers.types'

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(100, 'Use at most 100 characters')

export const createCustomerSchema = z.object({
  name: requiredText('Name'),
  contactName: requiredText('Contact name'),
  email: z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email')),
  city: requiredText('City'),
  status: z.enum(CUSTOMER_STATUSES, 'Select a status'),
})

export type CreateCustomerForm = z.infer<typeof createCustomerSchema>
export const updateCustomerSchema = createCustomerSchema.omit({ email: true })