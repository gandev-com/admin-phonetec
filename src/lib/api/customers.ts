import { httpClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { CreateCustomerDto, Customer, CustomerListParams, UpdateCustomerDto } from "@/types/customer";

export const customersApi = {
  async list(params: CustomerListParams = {}): Promise<PaginatedResponse<Customer>> {
    const response = await httpClient.get<PaginatedResponse<Customer>>("/customers", { params });
    return response.data;
  },

  async getOne(id: number | string): Promise<Customer> {
    const response = await httpClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  async create(data: CreateCustomerDto): Promise<Customer> {
    const response = await httpClient.post<Customer>("/customers", data);
    return response.data;
  },

  async update(id: number | string, data: UpdateCustomerDto): Promise<Customer> {
    const response = await httpClient.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    await httpClient.delete(`/customers/${id}`);
  },
};
