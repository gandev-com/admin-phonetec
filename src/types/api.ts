export interface ApiListResponse<T> {
  data?: T[];
  items?: T[];
  results?: T[];
  total?: number;
}

export type MaybeList<T> = T[] | ApiListResponse<T>;
