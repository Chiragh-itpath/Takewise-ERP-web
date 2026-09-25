import { apiClient } from '@/core/api/client'
import type { CreateCustomerRequest, Customer, UpdateCustomerRequest } from './customers.types'

export const customersApi = {
  async list(): Promise<Customer[]> {
    const { data } = await apiClient.get<Customer[]>('/customers')
    return data
  },

  async create(payload: CreateCustomerRequest): Promise<Customer> {
    const { data } = await apiClient.post<Customer>('/customers', payload)
    return data
  },

  async update(id: string, payload: UpdateCustomerRequest): Promise<Customer> {
    const { data } = await apiClient.put<Customer>(
      `/customers/${encodeURIComponent(id)}`,
      payload,
    )
    return data
  },
}