"use client";

import { use } from "react";

import { DeviceForm } from "@/features/devices/components/device-form";
import { useDevice } from "@/features/devices/hooks/use-devices";
import type { CreateDeviceFormValues } from "@/lib/schemas/device";

interface EditDevicePageProps {
  params: Promise<{ id: string }>;
}

export default function EditDevicePage({ params }: EditDevicePageProps) {
  const { id } = use(params);
  const { data: device, isLoading } = useDevice(id);

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando...</p>;
  }

  if (!device) {
    return <p className="text-destructive">Dispositivo no encontrado</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editar dispositivo</h1>
        <p className="text-muted-foreground">
          {device.brand?.name} {device.model}
        </p>
      </div>
      <DeviceForm
        customerId={String(device.customerId)}
        deviceId={id}
        defaultValues={device as unknown as Partial<CreateDeviceFormValues>}
      />
    </div>
  );
}
