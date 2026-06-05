import { httpClient } from "@/lib/api/client";
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
    const response = await httpClient.get<PaginatedResponse<Report>>("/reports", { params });
    return response.data;
  },

  async getOne(id: number | string): Promise<Report> {
    const response = await httpClient.get<Report>(`/reports/${id}`);
    return response.data;
  },

  async getByOrderNumber(orderNumber: string): Promise<Report> {
    const response = await httpClient.get<Report>(`/reports/order/${orderNumber}`);
    return response.data;
  },

  async getStats(period?: 'today' | 'week' | 'month' | 'all'): Promise<ReportStats> {
    const response = await httpClient.get<RawStats>("/reports/stats", { params: period ? { period } : undefined });
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
    const response = await httpClient.post<Report>("/reports", data);
    return response.data;
  },

  async update(id: number | string, data: UpdateReportDto): Promise<Report> {
    const response = await httpClient.patch<Report>(`/reports/${id}`, data);
    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    await httpClient.delete(`/reports/${id}`);
  },

  async readyForPickup(id: number | string, technicianId?: string): Promise<Report> {
    const response = await httpClient.patch<Report>(`/reports/${id}/ready-for-pickup`, {
      ...(technicianId ? { technicianId } : {}),
    });
    return response.data;
  },

  async deliver(
    id: number | string,
    signedBy: string,
    payload: { file?: File; signatureData?: string },
    technicianId?: string,
  ): Promise<Report> {
    const form = new FormData();
    form.append("signedBy", signedBy);
    if (payload.file) form.append("file", payload.file);
    if (payload.signatureData) form.append("signatureData", payload.signatureData);
    if (technicianId) form.append("technicianId", technicianId);
    const response = await httpClient.post<Report>(`/reports/${id}/deliver`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async signReception(
    id: number | string,
    signedBy: string,
    payload: { file?: File; signatureData?: string },
  ): Promise<Report> {
    const form = new FormData();
    form.append("signedBy", signedBy);
    if (payload.file) form.append("file", payload.file);
    if (payload.signatureData) form.append("signatureData", payload.signatureData);
    const response = await httpClient.post<Report>(`/reports/${id}/reception-consent`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async createForCustomer(customerId: number | string, data: Omit<CreateReportDto, "customerId">): Promise<Report> {
    const response = await httpClient.post<Report>(`/customers/${customerId}/reports`, data);
    return response.data;
  },
};
