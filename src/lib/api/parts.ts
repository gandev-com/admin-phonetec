import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import type { PaginatedResponse } from "@/types/api";
import type { CreatePartDto, Part, PartListParams, UpdatePartDto } from "@/types/part";

export const partsApi = {
  async list(params: PartListParams = {}): Promise<PaginatedResponse<Part>> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<PaginatedResponse<Part>>("/parts", { params });
    return response.data;
  },

  async getOne(id: number | string): Promise<Part> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<Part>(`/parts/${id}`);
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<string[]>("/parts/categories");
    return response.data;
  },

  async getLowStock(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Part>> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<PaginatedResponse<Part>>("/parts/low-stock", { params });
    return response.data;
  },

  async create(data: CreatePartDto): Promise<Part> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.post<Part>("/parts", data);
    return response.data;
  },

  async update(id: number | string, data: UpdatePartDto): Promise<Part> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.patch<Part>(`/parts/${id}`, data);
    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    await client.delete(`/parts/${id}`);
  },
};
