export interface Customer {
  id: number | string;
  documentType: string;
  document: string;
  firstName: string;
  lastName: string;
  secondLastName: string | null;
  phone1: string;
  phone2: string | null;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  dataConsent: boolean;
}
