export type DocumentType = "DNI" | "NIE" | "PASAPORTE" | "CIF";

export interface CustomerListParams {
  search?: string;
  documentType?: DocumentType;
  city?: string;
  province?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface Customer {
  id: number | string;
  documentType: DocumentType;
  document: string;
  firstName: string;
  lastName: string;
  secondLastName: string | null;
  phone1: string;
  phone2: string | null;
  email: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  dataConsent: boolean;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  documentType: DocumentType;
  document: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  email?: string;
  phone1: string;
  phone2?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  dataConsent: boolean;
  internalNotes?: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;
