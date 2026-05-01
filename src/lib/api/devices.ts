import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import type { PaginatedResponse } from "@/types/api";
import type { CreateDeviceDto, Device, DeviceListParams, UpdateDeviceDto } from "@/types/device";

export const devicesApi = {
  async list(params: DeviceListParams = {}): Promise<PaginatedResponse<Device>> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<PaginatedResponse<Device>>("/devices", { params });
    return response.data;
  },

  async getOne(id: number | string): Promise<Device> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<Device>(`/devices/${id}`);
    return response.data;
  },

  async create(data: CreateDeviceDto): Promise<Device> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.post<Device>("/devices", data);
    return response.data;
  },

  async update(id: number | string, data: UpdateDeviceDto): Promise<Device> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.patch<Device>(`/devices/${id}`, data);
    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    await client.delete(`/devices/${id}`);
  },
};
