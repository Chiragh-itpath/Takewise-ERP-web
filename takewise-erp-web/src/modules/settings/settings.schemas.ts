import { z } from 'zod'
import { CURRENCIES } from './settings.types'

export const settingsSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(100, 'Use at most 100 characters'),
  defaultCurrency: z.enum(CURRENCIES, 'Select a currency'),
  invoicePrefix: z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2,6}$/, 'Use 2–6 letters (A–Z)'),
})