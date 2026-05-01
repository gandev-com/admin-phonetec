import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import { normalizeListResponse } from "@/lib/api/helpers";
import type { MaybeList } from "@/types/api";
import type { User } from "@/types/user";

export const usersApi = {
  async list() {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<MaybeList<User>>("/users");
    return normalizeListResponse(response.data);
  },
};
