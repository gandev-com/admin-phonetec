import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import { normalizeListResponse } from "@/lib/api/helpers";
import type { MaybeList, PaginatedResponse } from "@/types/api";
import type { ChangePasswordDto, UpdateUserDto, User, UserListParams } from "@/types/user";

export const usersApi = {
  async list(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<MaybeList<User> | PaginatedResponse<User>>("/users", { params });
    const data = response.data;
    if (!Array.isArray(data) && "meta" in data && typeof (data as PaginatedResponse<User>).meta?.total === "number") {
      return data as PaginatedResponse<User>;
    }
    const items = normalizeListResponse(data as MaybeList<User>);
    return { data: items, meta: { total: items.length, page: params.page ?? 1, limit: params.limit ?? items.length, totalPages: 1 } };
  },

  async getMe(): Promise<User> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<User>("/users/me");
    return response.data;
  },

  async getOne(id: number | string): Promise<User> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<User>(`/users/${id}`);
    return response.data;
  },

  async update(id: number | string, data: UpdateUserDto): Promise<User> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  async changeMyPassword(data: ChangePasswordDto): Promise<void> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    await client.patch("/users/me/password", data);
  },

  async deactivate(id: number | string): Promise<void> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    await client.patch(`/users/${id}/deactivate`);
  },
};
