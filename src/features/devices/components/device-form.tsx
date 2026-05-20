"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AccessoriesChecklist } from "@/features/devices/components/accessories-checklist";
import { BrandModelSelector } from "@/features/devices/components/brand-model-selector";
import { ImeiInput } from "@/features/devices/components/imei-input";
import { useCreateDevice, useUpdateDevice } from "@/features/devices/hooks/use-devices";
import {
  createDeviceSchema,
  type CreateDeviceFormValues,
} from "@/lib/schemas/device";

interface DeviceFormProps {
  customerId: string;
  defaultValues?: Partial<CreateDeviceFormValues>;
  deviceId?: string;
}

export function DeviceForm({ customerId, defaultValues, deviceId }: DeviceFormProps) {
  const router = useRouter();
  const createMutation = useCreateDevice();
  const updateMutation = useUpdateDevice(deviceId ?? "");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateDeviceFormValues>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: {
      customerId,
      hasBackCover: false,
      hasBattery: false,
      hasSimCard: false,
      hasSdCard: false,
      hasCharger: false,
      hasPattern: false,
      hasPin: false,
      hasFingerprint: false,
      patternUnlocked: false,
      ...defaultValues,
    },
  });

  const onSubmit = async (data: CreateDeviceFormValues) => {
    try {
      const payload = {
        ...data,
        imeiIn: data.imeiIn || undefined,
        imeiOut: data.imeiOut || undefined,
      };
      if (deviceId) {
        await updateMutation.mutateAsync(payload);
        toast.success("Dispositivo actualizado");
        router.push(`/devices/${deviceId}`);
      } else {
        const device = await createMutation.mutateAsync(payload);
        toast.success("Dispositivo registrado");
        router.push(`/devices/${String(device.id)}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identificación */}
      <Card>
        <CardHeader>
          <CardTitle>Identificación del dispositivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={control}
            name="brandId"
            render={({ field }) => (
              <BrandModelSelector
                brandId={field.value}
                modelValue={watch("model")}
                onBrandChange={(id) => {
                  field.onChange(id);
                  setValue("model", "");
                }}
                onModelChange={(m) => setValue("model", m)}
                brandError={errors.brandId?.message}
                modelError={errors.model?.message}
              />
            )}
          />

          {/* IMEIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="imeiIn"
              render={({ field }) => (
                <ImeiInput
                  label="IMEI entrada (opcional)"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.imeiIn?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="imeiOut"
              render={({ field }) => (
                <ImeiInput
                  label="IMEI salida (opcional, dual SIM)"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.imeiOut?.message}
                />
              )}
            />
          </div>

          <div className="space-y-1">
            <Label>Número de serie</Label>
            <Input {...register("serialNumber")} placeholder="Opcional" />
          </div>
        </CardContent>
      </Card>

      {/* Accesorios */}
      <Card>
        <CardContent className="pt-6">
          <AccessoriesChecklist
            values={{
              hasBackCover: watch("hasBackCover") ?? false,
              hasBattery: watch("hasBattery") ?? false,
              hasSimCard: watch("hasSimCard") ?? false,
              hasSdCard: watch("hasSdCard") ?? false,
              hasCharger: watch("hasCharger") ?? false,
            }}
            otherAccessories={watch("otherAccessories") ?? ""}
            onChange={(key, value) =>
              setValue(key as keyof CreateDeviceFormValues, value as never)
            }
            onOtherChange={(v) => setValue("otherAccessories", v)}
          />
        </CardContent>
      </Card>

      {/* Condición visual */}
      <Card>
        <CardHeader>
          <CardTitle>Condición visual</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Pantalla</Label>
            <Textarea
              {...register("screenCondition")}
              placeholder="Ej: Pantalla rota"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label>Carcasa</Label>
            <Textarea
              {...register("caseCondition")}
              placeholder="Ej: Rasguños leves"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label>Golpes</Label>
            <Input {...register("dents")} placeholder="Ej: Golpe esquina inferior" />
          </div>
          <div className="space-y-1">
            <Label>Rayones</Label>
            <Input {...register("scratches")} placeholder="Ej: Rayones en pantalla" />
          </div>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad del dispositivo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { key: "hasPattern", label: "Patrón" },
              { key: "hasPin", label: "PIN" },
              { key: "hasFingerprint", label: "Huella" },
              { key: "patternUnlocked", label: "Desbloqueado" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Controller
                control={control}
                name={key}
                render={({ field }) => (
                  <Checkbox
                    id={key}
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  />
                )}
              />
              <Label htmlFor={key} className="cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : deviceId
              ? "Guardar cambios"
              : "Registrar dispositivo"}
        </Button>
      </div>
    </form>
  );
}
