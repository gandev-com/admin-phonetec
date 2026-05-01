// ─── Enums ────────────────────────────────────────────────────────────────────

// ─── Brand / Model ────────────────────────────────────────────────────────────

export interface Brand {
  id: number | string;
  name: string;
  logo: string | null;
  isActive: boolean;
  order: number;
  models?: DeviceModel[];
}

export interface DeviceModel {
  id: number | string;
  name: string;
  brandId: number | string;
}

// ─── Device ───────────────────────────────────────────────────────────────────

export interface Device {
  id: number | string;
  customerId: number | string;
  brandId: number | string;
  brand?: Brand;

  // Model is a free-text string in the backend
  model: string | null;

  // IMEI (two: received vs returned)
  imeiIn: string | null;
  imeiOut: string | null;
  serialNumber: string | null;

  // Accessories (individual flags)
  hasBackCover: boolean;
  hasBattery: boolean;
  hasSimCard: boolean;
  hasSdCard: boolean;
  hasCharger: boolean;
  otherAccessories: string | null;

  // Physical condition
  screenCondition: string | null;
  caseCondition: string | null;
  dents: string | null;
  scratches: string | null;

  // Security
  hasPattern: boolean;
  hasPin: boolean;
  hasFingerprint: boolean;
  patternUnlocked: boolean;

  createdAt: string;
  updatedAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateDeviceDto {
  customerId: string;
  brandId: string;
  model?: string;
  imeiIn?: string;
  imeiOut?: string;
  serialNumber?: string;
  hasBackCover?: boolean;
  hasBattery?: boolean;
  hasSimCard?: boolean;
  hasSdCard?: boolean;
  hasCharger?: boolean;
  otherAccessories?: string;
  screenCondition?: string;
  caseCondition?: string;
  dents?: string;
  scratches?: string;
  hasPattern?: boolean;
  hasPin?: boolean;
  hasFingerprint?: boolean;
  patternUnlocked?: boolean;
}

export type UpdateDeviceDto = Partial<CreateDeviceDto>;

// ─── List params ──────────────────────────────────────────────────────────────

export interface DeviceListParams {
  search?: string;
  customerId?: string;
  brandId?: string;
  page?: number;
  limit?: number;
}

export interface BrandListParams {
  search?: string;
  isActive?: boolean;
}
