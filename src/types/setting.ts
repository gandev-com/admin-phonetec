export interface Setting {
  id: number | string;
  key: string;
  value: string | null;
  label: string | null;
  description: string | null;
  category: string | null;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingDto {
  value: string;
}
