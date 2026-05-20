import { httpClient } from "@/lib/api/client";
import type { Setting, UpdateSettingDto } from "@/types/setting";

export const settingsApi = {
  async list(category?: string): Promise<Setting[]> {
    const response = await httpClient.get<Setting[]>("/settings", {
      params: category ? { category } : {},
    });
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await httpClient.get<string[]>("/settings/categories");
    return response.data;
  },

  async getByKey(key: string): Promise<Setting> {
    const response = await httpClient.get<Setting>(`/settings/${key}`);
    return response.data;
  },

  async update(key: string, data: UpdateSettingDto): Promise<Setting> {
    const response = await httpClient.patch<Setting>(`/settings/${key}`, data);
    return response.data;
  },
};
