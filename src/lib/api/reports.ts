import { apiClient, authlessClient } from "@/lib/api/client";
import { AUTH_DISABLED } from "@/lib/config";
import type { PaginatedResponse } from "@/types/api";
import type { CreateReportDto, PaymentStatus, Report, ReportListParams, ReportStats, ReportStatus, UpdateReportDto } from "@/types/report";

// The backend may return groupBy arrays from Prisma instead of plain records.
type GroupByEntry<K extends string> = { _count: number } & Record<K, string>;
type RawStats = Omit<ReportStats, "byStatus" | "byPaymentStatus"> & {
  byStatus:
    | Partial<Record<ReportStatus, number>>
    | GroupByEntry<"currentStatus">[];
  byPaymentStatus:
    | Partial<Record<PaymentStatus, number>>
    | GroupByEntry<"paymentStatus">[];
};

function normalizeGroupBy<K extends string>(
  raw: Partial<Record<string, number>> | GroupByEntry<K>[],
  key: K,
): Partial<Record<string, number>> {
  if (Array.isArray(raw)) {
    return Object.fromEntries(raw.map((entry) => [entry[key], entry._count]));
  }
  return raw;
}

export const reportsApi = {
  async list(params: ReportListParams = {}): Promise<PaginatedResponse<Report>> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<PaginatedResponse<Report>>("/reports", { params });
    return response.data;
  },

  async getOne(id: number | string): Promise<Report> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<Report>(`/reports/${id}`);
    return response.data;
  },

  async getByOrderNumber(orderNumber: string): Promise<Report> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<Report>(`/reports/order/${orderNumber}`);
    return response.data;
  },

  async getStats(): Promise<ReportStats> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.get<RawStats>("/reports/stats");
    const raw = response.data;
    return {
      ...raw,
      byStatus: normalizeGroupBy(
        raw.byStatus as GroupByEntry<"currentStatus">[],
        "currentStatus",
      ) as Partial<Record<ReportStatus, number>>,
      byPaymentStatus: normalizeGroupBy(
        raw.byPaymentStatus as GroupByEntry<"paymentStatus">[],
        "paymentStatus",
      ) as Partial<Record<PaymentStatus, number>>,
    };
  },

  async create(data: CreateReportDto): Promise<Report> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.post<Report>("/reports", data);
    return response.data;
  },

  async update(id: number | string, data: UpdateReportDto): Promise<Report> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.patch<Report>(`/reports/${id}`, data);
    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    await client.delete(`/reports/${id}`);
  },

  async readyForPickup(id: number | string, technicianId?: string): Promise<Report> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.patch<Report>(`/reports/${id}/ready-for-pickup`, {
      ...(technicianId ? { technicianId } : {}),
    });
    return response.data;
  },

  async deliver(
    id: number | string,
    file: File,
    signedBy: string,
    technicianId?: string,
  ): Promise<Report> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const form = new FormData();
    form.append("file", file);
    form.append("signedBy", signedBy);
    if (technicianId) form.append("technicianId", technicianId);
    const response = await client.post<Report>(`/reports/${id}/deliver`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async createForCustomer(customerId: number | string, data: Omit<CreateReportDto, "customerId">): Promise<Report> {
    const client = AUTH_DISABLED ? authlessClient : apiClient;
    const response = await client.post<Report>(`/customers/${customerId}/reports`, data);
    return response.data;
  },
};
