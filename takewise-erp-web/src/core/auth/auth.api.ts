import { apiClient } from '@/core/api/client'
import type {
  ForgotPasswordRequest,
  LoginRequest,
  MeResponse,
  ResetPasswordRequest,
} from './auth.types'

export const authApi = {
  async login(payload: LoginRequest): Promise<MeResponse> {
    const { data } = await apiClient.post<MeResponse>('/auth/login', payload)
    return data
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  async me(): Promise<MeResponse> {
    const { data } = await apiClient.get<MeResponse>('/auth/me')
    return data
  },

  async refresh(): Promise<void> {
    await apiClient.post('/auth/refresh')
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', payload)
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/reset-password', payload)
  },
}