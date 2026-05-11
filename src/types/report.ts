import type { Customer } from "./customer";
import type { Device } from "./device";
import type { User } from "./user";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ReportType =
  | "REPAIR_ORDER"
  | "BUDGET"
  | "REVISION"
  | "WARRANTY";

export type ReportStatus =
  | "RECEIVED"
  | "IN_DIAGNOSIS"
  | "BUDGET_SENT"
  | "BUDGET_ACCEPTED"
  | "BUDGET_REJECTED"
  | "WAITING_PARTS"
  | "IN_REPAIR"
  | "REPAIRED"
  | "TESTING"
  | "READY_FOR_PICKUP"
  | "DELIVERED"
  | "CANCELLED"
  | "IRREPARABLE";

export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "REFUNDED";

export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type WarrantyType =
  | "NO_WARRANTY"
  | "WARRANTY_3_MONTHS"
  | "WARRANTY_6_MONTHS"
  | "WARRANTY_12_MONTHS"
  | "WARRANTY_24_MONTHS"
  | "MANUFACTURER_WARRANTY";

export type ExitCondition =
  | "REPAIRED"
  | "PARTIALLY_REPAIRED"
  | "NOT_REPAIRED"
  | "CLIENT_NOT_AUTHORIZED"
  | "IRREPARABLE";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface ReportPart {
  id: number | string;
  partId: number | string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Report {
  id: number | string;
  orderNumber: string;
  reportType: ReportType;
  currentStatus: ReportStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  priority: Priority;
  isUrgent: boolean;

  // Problem & repair
  reportedIssue: string | null;
  entryCondition: string | null;
  technicalDiagnosis: string | null;
  repairPerformed: string | null;
  exitCondition: ExitCondition | null;
  internalNotes: string | null;
  customerNotes: string | null;

  // Budget & costs
  initialBudget: number | null;
  finalBudget: number | null;
  partsCost: number | null;
  laborCost: number | null;
  discount: number | null;
  total: number | null;

  // Warranty
  warrantyType: WarrantyType;
  warrantyDays: number;
  warrantyEndDate: string | null;

  // Dates
  receptionDate: string | null;
  estimatedDeliveryDate: string | null;
  repairDate: string | null;
  deliveryDate: string | null;
  cancellationDate: string | null;

  // Relations
  customerId: number | string;
  deviceId: number | string;
  technicianId: number | string | null;
  customer?: Customer;
  device?: Device;
  technician?: User;
  parts?: ReportPart[];
  consentDocument?: ConsentDocument;   // legacy — delivery only
  consentDocuments?: ConsentDocument[]; // preferred — all documents

  createdAt: string;
  updatedAt: string;
}

export type ConsentType = "RECEPTION" | "DELIVERY";

export interface ConsentDocument {
  id: string;
  type: ConsentType;
  filePath: string;
  fileUrl?: string;  // full public URL served by the backend
  signedBy: string;
  signedAt: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface ReportStats {
  total: number;
  byStatus: Partial<Record<ReportStatus, number>>;
  byPaymentStatus: Partial<Record<PaymentStatus, number>>;
  totalRevenue: number;
  pendingRevenue: number;
  urgentOpen: number;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateReportDto {
  reportType: ReportType;
  customerId: string;
  deviceId: string;
  technicianId?: string;
  receptionDate?: string;
  estimatedDeliveryDate?: string;
  reportedIssue?: string;
  entryCondition?: string;
  initialBudget?: number;
  warrantyType?: WarrantyType;
  warrantyDays?: number;
  priority?: Priority;
  isUrgent?: boolean;
  internalNotes?: string;
  customerNotes?: string;
  paymentMethod?: string;
}

export interface UpdateReportDto {
  technicianId?: string;
  estimatedDeliveryDate?: string;
  repairDate?: string;
  deliveryDate?: string;
  cancellationDate?: string;
  reportedIssue?: string;
  technicalDiagnosis?: string;
  repairPerformed?: string;
  currentStatus?: ReportStatus;
  initialBudget?: number;
  finalBudget?: number;
  partsCost?: number;
  laborCost?: number;
  discount?: number;
  total?: number;
  warrantyType?: WarrantyType;
  warrantyDays?: number;
  warrantyEndDate?: string;
  entryCondition?: string;
  exitCondition?: ExitCondition;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  priority?: Priority;
  isUrgent?: boolean;
  internalNotes?: string;
  customerNotes?: string;
}

// ─── List params ──────────────────────────────────────────────────────────────

export interface ReportListParams {
  search?: string;
  customerId?: string;
  deviceId?: string;
  technicianId?: string;
  reportType?: ReportType;
  currentStatus?: ReportStatus;
  paymentStatus?: PaymentStatus;
  priority?: Priority;
  isUrgent?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "createdAt" | "receptionDate" | "estimatedDeliveryDate" | "priority" | "orderNumber" | "total" | "currentStatus";
  order?: "asc" | "desc";
  activeFirst?: boolean;
  updatedSince?: string;
  include?: string;
  page?: number;
  limit?: number;
}
