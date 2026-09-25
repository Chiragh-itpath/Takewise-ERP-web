import { apiClient } from '@/core/api/client'
import type { CompanySettings } from './settings.types'

// Settings always belong to the active company (tenant header is automatic)
export const settingsApi = {
  async get(): Promise<CompanySettings> {
    const { data } = await apiClient.get<CompanySettings>('/settings')
    return data
  },

  async update(payload: CompanySettings): Promise<CompanySettings> {
    const { data } = await apiClient.put<CompanySettings>('/settings', payload)
    return data
  },
}