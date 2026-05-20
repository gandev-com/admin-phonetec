import { httpClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { ActivityLog, ActivityLogListParams } from "@/types/activity-log";

export const activityLogApi = {
  async list(params: ActivityLogListParams = {}): Promise<PaginatedResponse<ActivityLog>> {
    const response = await httpClient.get<PaginatedResponse<ActivityLog>>("/activity-log", { params });
    return response.data;
  },

  async getEntities(): Promise<string[]> {
    const response = await httpClient.get<string[]>("/activity-log/entities");
    return response.data;
  },
};
