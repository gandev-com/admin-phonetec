export interface ApiListResponse<T> {
  data?: T[];
  items?: T[];
  results?: T[];
  total?: number;
}

export type MaybeList<T> = T[] | ApiListResponse<T>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
