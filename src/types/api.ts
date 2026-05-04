export interface ApiListResponse<T> {
  data?: T[];
  items?: T[];
  results?: T[];
  total?: number;
}

export type MaybeList<T> = T[] | ApiListResponse<T>;

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
