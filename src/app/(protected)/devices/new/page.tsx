"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { DeviceForm } from "@/features/devices/components/device-form";

function NewDeviceContent() {
  const params = useSearchParams();
  const customerId = params.get("customerId") ?? "";

  return <DeviceForm customerId={customerId} />;
}

export default function NewDevicePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo dispositivo</h1>
        <p className="text-muted-foreground">Registrar un dispositivo para el cliente</p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Cargando...</p>}>
        <NewDeviceContent />
      </Suspense>
    </div>
  );
}
