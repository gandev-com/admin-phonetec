// ─── Entity ───────────────────────────────────────────────────────────────────

export interface Part {
  id: number | string;
  code: string | null;
  name: string;
  description: string | null;
  category: string | null;
  brands: string[];
  models: string[];
  stock: number;
  minStock: number;
  location: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
  supplier: string | null;
  supplierReference: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreatePartDto {
  code?: string;
  name: string;
  description?: string;
  category?: string;
  brands?: string[];
  models?: string[];
  stock?: number;
  minStock?: number;
  location?: string;
  purchasePrice?: number;
  salePrice?: number;
  supplier?: string;
  supplierReference?: string;
  isActive?: boolean;
}

export type UpdatePartDto = Partial<CreatePartDto>;

// ─── List params ──────────────────────────────────────────────────────────────

export interface PartListParams {
  search?: string;
  category?: string;
  brand?: string;
  isActive?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}
