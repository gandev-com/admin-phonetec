"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { devicesApi } from "@/lib/api/devices";
import type { CreateDeviceDto, DeviceListParams, UpdateDeviceDto } from "@/types/device";

export function useDevices(params: DeviceListParams = {}) {
  return useQuery({
    queryKey: ["devices", params],
    queryFn: () => devicesApi.list(params),
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ["devices", id],
    queryFn: () => devicesApi.getOne(id),
    enabled: !!id,
  });
}

export function useDeviceImages(deviceId: string) {
  return useQuery({
    queryKey: ["devices", deviceId, "images"],
    queryFn: () => devicesApi.getImages(deviceId),
    enabled: !!deviceId,
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDeviceDto) => devicesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
}

export function useUpdateDevice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDeviceDto) => devicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices", id] });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
}

export function useUploadDeviceImage(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      type,
      order,
      description,
    }: {
      file: File;
      type: string;
      order: number;
      description?: string;
    }) => devicesApi.uploadImage(deviceId, file, type, order, description),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["devices", deviceId, "images"] }),
  });
}

export function useDeleteDeviceImage(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => devicesApi.deleteImage(deviceId, imageId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["devices", deviceId, "images"] }),
  });
}
