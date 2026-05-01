import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import type { PaginatedResponse } from "@/types/api";
import type { ActivityLog, ActivityLogListParams } from "@/types/activity-log";

export const activityLogApi = {
  async list(params: ActivityLogListParams = {}): Promise<PaginatedResponse<ActivityLog>> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<PaginatedResponse<ActivityLog>>("/activity-log", { params });
    return response.data;
  },

  async getEntities(): Promise<string[]> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<string[]>("/activity-log/entities");
    return response.data;
  },
};
