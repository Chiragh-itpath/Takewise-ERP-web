export const CURRENCIES = ['EUR', 'USD', 'GBP'] as const
export type Currency = (typeof CURRENCIES)[number]

export interface CompanySettings {
  companyName: string
  defaultCurrency: Currency
  invoicePrefix: string
}