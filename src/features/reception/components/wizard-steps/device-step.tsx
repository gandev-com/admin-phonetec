"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandModelSelector } from "@/features/devices/components/brand-model-selector";
import { devicesApi } from "@/lib/api/devices";
import { deviceSchema, type DeviceFormValues } from "@/lib/schemas/reception";
import type { Customer } from "@/types/customer";
import type { Device } from "@/types/device";

import { CustomerInfoCard } from "./customer-info-card";

interface DeviceStepProps {
  customer: Customer;
  subStep: "select-device" | "new-device";
  onDeviceSelected: (device: Device) => void;
  onAddNewDevice: () => void;
  onChangeCustomer: () => void;
  onBack: () => void;
}

export function DeviceStep({
  customer,
  subStep,
  onDeviceSelected,
  onAddNewDevice,
  onChangeCustomer,
  onBack,
}: DeviceStepProps) {
  const queryClient = useQueryClient();

  const devicesQuery = useQuery({
    queryKey: ["devices", { customerId: String(customer.id) }],
    queryFn: () => devicesApi.list({ customerId: String(customer.id), limit: 50 }),
  });
  const devices = devicesQuery.data?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<DeviceFormValues>({ resolver: zodResolver(deviceSchema) });

  const modelValue = useWatch({ control, name: "model" });

  const createDeviceMutation = useMutation({
    mutationFn: (data: DeviceFormValues) =>
      devicesApi.create({
        ...data,
        customerId: String(customer.id),
        imeiIn: data.imeiIn || undefined,
      }),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success("Dispositivo registrado");
      onDeviceSelected(device);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response
        ?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(detail ? `Error: ${detail}` : "Error al registrar el dispositivo");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dispositivo</CardTitle>
          <button
            type="button"
            onClick={onChangeCustomer}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Cambiar cliente
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CustomerInfoCard customer={customer} />

        {subStep === "select-device" && (
          <>
            {devicesQuery.isPending && (
              <p className="text-sm text-muted-foreground">Cargando dispositivos…</p>
            )}
            {!devicesQuery.isPending && devices.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Este cliente no tiene dispositivos registrados.
              </p>
            )}
            {devices.length > 0 && (
              <ul className="space-y-2">
                {devices.map((device) => (
                  <li key={device.id}>
                    <button
                      type="button"
                      onClick={() => onDeviceSelected(device)}
                      className="w-full flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {device.brand?.name} {device.model}
                        </p>
                        {device.imeiIn && (
                          <p className="text-xs text-muted-foreground">IMEI: {device.imeiIn}</p>
                        )}
                      </div>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button type="button" variant="outline" className="w-full" onClick={onAddNewDevice}>
              + Registrar nuevo dispositivo
            </Button>
          </>
        )}

        {subStep === "new-device" && (
          <form
            onSubmit={handleSubmit((data) => createDeviceMutation.mutate(data))}
            className="space-y-4"
          >
            <Controller
              control={control}
              name="brandId"
              render={({ field }) => (
                <BrandModelSelector
                  brandId={field.value}
                  modelValue={modelValue || undefined}
                  onBrandChange={(id) => {
                    field.onChange(id);
                    setValue("model", "");
                  }}
                  onModelChange={(model) => setValue("model", model)}
                  brandError={errors.brandId?.message}
                  modelError={errors.model?.message}
                />
              )}
            />
            <div className="space-y-1">
              <Label htmlFor="dev-imei">IMEI (opcional)</Label>
              <Input
                id="dev-imei"
                {...register("imeiIn")}
                placeholder="15 dígitos"
                maxLength={15}
              />
              {errors.imeiIn && (
                <p className="text-xs text-destructive">{errors.imeiIn.message}</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onBack}>
                Volver
              </Button>
              <Button
                type="submit"
                disabled={createDeviceMutation.isPending}
                className="flex-1"
              >
                {createDeviceMutation.isPending ? "Guardando…" : "Registrar dispositivo"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
