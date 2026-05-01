import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import { normalizeListResponse } from "@/lib/api/helpers";
import type { MaybeList } from "@/types/api";
import type { Customer } from "@/types/customer";

export const customersApi = {
  async list() {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<MaybeList<Customer>>("/customers");
    return normalizeListResponse(response.data);
  },
};
