import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateDeviceDto,
  Device,
  DeviceImage,
  DeviceListParams,
  UpdateDeviceDto,
} from "@/types/device";

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

  // ─── Images ─────────────────────────────────────────────────────────────────

  async getImages(deviceId: number | string): Promise<DeviceImage[]> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<DeviceImage[]>(`/devices/${deviceId}/images`);
    return response.data;
  },

  async uploadImage(
    deviceId: number | string,
    file: File,
    type: string,
    order: number,
    description?: string,
  ): Promise<DeviceImage> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    form.append("order", String(order));
    if (description) form.append("description", description);
    const response = await client.post<DeviceImage>(`/devices/${deviceId}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async deleteImage(deviceId: number | string, imageId: string): Promise<void> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    await client.delete(`/devices/${deviceId}/images/${imageId}`);
  },
};
