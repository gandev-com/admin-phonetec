"use client";

import { useQuery } from "@tanstack/react-query";

import { brandsApi } from "@/lib/api/brands";

export function useBrands(search?: string) {
  return useQuery({
    queryKey: ["brands", search],
    queryFn: () => brandsApi.list(search ? { search, isActive: true } : { isActive: true }),
  });
}

export function useBrandModels(brandId: string | undefined) {
  return useQuery({
    queryKey: ["brands", brandId, "models"],
    queryFn: () => brandsApi.getModels(brandId!),
    enabled: !!brandId,
  });
}
