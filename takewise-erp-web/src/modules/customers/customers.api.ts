import { apiClient } from '@/core/api/client'
import type { CreateCustomerRequest, Customer } from './customers.types'

export const customersApi = {
  async list(): Promise<Customer[]> {
    const { data } = await apiClient.get<Customer[]>('/customers')
    return data
  },

  async create(payload: CreateCustomerRequest): Promise<Customer> {
    const { data } = await apiClient.post<Customer>('/customers', payload)
    return data
  },
}