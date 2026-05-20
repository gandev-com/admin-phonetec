import { httpClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { CreatePartDto, Part, PartListParams, UpdatePartDto } from "@/types/part";

export const partsApi = {
  async list(params: PartListParams = {}): Promise<PaginatedResponse<Part>> {
    const response = await httpClient.get<PaginatedResponse<Part>>("/parts", { params });
    return response.data;
  },

  async getOne(id: number | string): Promise<Part> {
    const response = await httpClient.get<Part>(`/parts/${id}`);
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await httpClient.get<string[]>("/parts/categories");
    return response.data;
  },

  async getLowStock(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Part>> {
    const response = await httpClient.get<PaginatedResponse<Part>>("/parts/low-stock", { params });
    return response.data;
  },

  async create(data: CreatePartDto): Promise<Part> {
    const response = await httpClient.post<Part>("/parts", data);
    return response.data;
  },

  async update(id: number | string, data: UpdatePartDto): Promise<Part> {
    const response = await httpClient.patch<Part>(`/parts/${id}`, data);
    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    await httpClient.delete(`/parts/${id}`);
  },
};
