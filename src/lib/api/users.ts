import { httpClient } from "@/lib/api/client";
import { normalizeListResponse } from "@/lib/api/helpers";
import type { MaybeList, PaginatedResponse } from "@/types/api";
import type { ChangePasswordDto, UpdateUserDto, User, UserListParams } from "@/types/user";

export const usersApi = {
  async list(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
    const response = await httpClient.get<MaybeList<User> | PaginatedResponse<User>>("/users", { params });
    const data = response.data;
    if (!Array.isArray(data) && "meta" in data && typeof (data as PaginatedResponse<User>).meta?.total === "number") {
      return data as PaginatedResponse<User>;
    }
    const items = normalizeListResponse(data as MaybeList<User>);
    return { data: items, meta: { total: items.length, page: params.page ?? 1, limit: params.limit ?? items.length, totalPages: 1 } };
  },

  async getMe(): Promise<User> {
    const response = await httpClient.get<User>("/users/me");
    return response.data;
  },

  async getOne(id: number | string): Promise<User> {
    const response = await httpClient.get<User>(`/users/${id}`);
    return response.data;
  },

  async update(id: number | string, data: UpdateUserDto): Promise<User> {
    const response = await httpClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  async changeMyPassword(data: ChangePasswordDto): Promise<void> {
    await httpClient.patch("/users/me/password", data);
  },

  async deactivate(id: number | string): Promise<void> {
    await httpClient.patch(`/users/${id}/deactivate`);
  },
};
