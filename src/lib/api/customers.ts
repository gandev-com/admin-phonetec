import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import type { PaginatedResponse } from "@/types/api";
import type { CreateCustomerDto, Customer, CustomerListParams, UpdateCustomerDto } from "@/types/customer";

export const customersApi = {
  async list(params: CustomerListParams = {}): Promise<PaginatedResponse<Customer>> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<PaginatedResponse<Customer>>("/customers", { params });
    return response.data;
  },

  async getOne(id: number | string): Promise<Customer> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  async create(data: CreateCustomerDto): Promise<Customer> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.post<Customer>("/customers", data);
    return response.data;
  },

  async update(id: number | string, data: UpdateCustomerDto): Promise<Customer> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    await client.delete(`/customers/${id}`);
  },
};
