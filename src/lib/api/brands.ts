import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import type { PaginatedResponse } from "@/types/api";
import type { Brand, BrandListParams, DeviceModel } from "@/types/device";

export const brandsApi = {
  async list(params: BrandListParams = {}): Promise<Brand[]> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<Brand[] | PaginatedResponse<Brand>>("/brands", { params });
    const data = response.data;
    return Array.isArray(data) ? data : data.data;
  },

  async getOne(id: number | string): Promise<Brand> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<Brand>(`/brands/${id}`);
    return response.data;
  },

  async getModels(brandId: number | string): Promise<DeviceModel[]> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<DeviceModel[]>(`/brands/${brandId}/models`);
    return response.data;
  },

  async create(data: { name: string; logo?: string; isActive?: boolean; order?: number }): Promise<Brand> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.post<Brand>("/brands", data);
    return response.data;
  },

  async update(id: number | string, data: Partial<{ name: string; logo: string; isActive: boolean; order: number }>): Promise<Brand> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.patch<Brand>(`/brands/${id}`, data);
    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    await client.delete(`/brands/${id}`);
  },

  async createModel(data: { name: string; brandId: string }): Promise<DeviceModel> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.post<DeviceModel>("/brands/models", data);
    return response.data;
  },

  async removeModel(modelId: number | string): Promise<void> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    await client.delete(`/brands/models/${modelId}`);
  },
};
