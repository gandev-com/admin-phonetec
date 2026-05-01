import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import type { Setting, UpdateSettingDto } from "@/types/setting";

export const settingsApi = {
  async list(category?: string): Promise<Setting[]> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<Setting[]>("/settings", {
      params: category ? { category } : {},
    });
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<string[]>("/settings/categories");
    return response.data;
  },

  async getByKey(key: string): Promise<Setting> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<Setting>(`/settings/${key}`);
    return response.data;
  },

  async update(key: string, data: UpdateSettingDto): Promise<Setting> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.patch<Setting>(`/settings/${key}`, data);
    return response.data;
  },
};
