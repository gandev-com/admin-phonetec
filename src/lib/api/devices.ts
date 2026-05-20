import { httpClient } from "@/lib/api/client";
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
    const response = await httpClient.get<PaginatedResponse<Device>>("/devices", { params });
    return response.data;
  },

  async getOne(id: number | string): Promise<Device> {
    const response = await httpClient.get<Device>(`/devices/${id}`);
    return response.data;
  },

  async create(data: CreateDeviceDto): Promise<Device> {
    const response = await httpClient.post<Device>("/devices", data);
    return response.data;
  },

  async update(id: number | string, data: UpdateDeviceDto): Promise<Device> {
    const response = await httpClient.patch<Device>(`/devices/${id}`, data);
    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    await httpClient.delete(`/devices/${id}`);
  },

  // ─── Images ─────────────────────────────────────────────────────────────────

  async getImages(deviceId: number | string): Promise<DeviceImage[]> {
    const response = await httpClient.get<DeviceImage[]>(`/devices/${deviceId}/images`);
    return response.data;
  },

  async uploadImage(
    deviceId: number | string,
    file: File,
    type: string,
    order: number,
    description?: string,
  ): Promise<DeviceImage> {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    form.append("order", String(order));
    if (description) form.append("description", description);
    const response = await httpClient.post<DeviceImage>(`/devices/${deviceId}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async deleteImage(deviceId: number | string, imageId: string): Promise<void> {
    await httpClient.delete(`/devices/${deviceId}/images/${imageId}`);
  },
};
