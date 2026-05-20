"use client";

import { use } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/shared/back-button";
import { DeviceImagesGallery } from "@/features/devices/components/device-images-gallery";
import { useDevice } from "@/features/devices/hooks/use-devices";

interface DeviceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DeviceDetailPage({ params }: DeviceDetailPageProps) {
  const { id } = use(params);
  const { data: device, isLoading } = useDevice(id);

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando...</p>;
  }

  if (!device) {
    return <p className="text-destructive">Dispositivo no encontrado</p>;
  }

  const deviceAny = device as unknown as {
    customer?: { id: string; firstName: string; lastName: string };
    images?: unknown[];
    reports?: Array<{ id: string; orderNumber: string; currentStatus: string }>;
    _count?: { reports: number };
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-4">
        <BackButton fallback="/devices" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {device.brand?.name} {device.model}
          </h1>
          {deviceAny.customer && (
            <p className="text-muted-foreground">
              Cliente:{" "}
              <Link
                href={`/customers/${deviceAny.customer.id}`}
                className="underline"
              >
                {deviceAny.customer.firstName} {deviceAny.customer.lastName}
              </Link>
            </p>
          )}
        </div>
        <Link href={`/devices/${id}/edit`} className={buttonVariants()}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Link>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="images">
            Imágenes ({deviceAny.images?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="reports">
            Informes ({deviceAny._count?.reports ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identificación</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">IMEI entrada: </span>
                <span className="font-mono">{device.imeiIn ?? "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">IMEI salida: </span>
                <span className="font-mono">{device.imeiOut ?? "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">N.º Serie: </span>
                {device.serialNumber ?? "—"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accesorios</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {device.hasBackCover && <Badge variant="outline">Tapa trasera</Badge>}
              {device.hasBattery && <Badge variant="outline">Batería</Badge>}
              {device.hasSimCard && <Badge variant="outline">SIM</Badge>}
              {device.hasSdCard && <Badge variant="outline">SD</Badge>}
              {device.hasCharger && <Badge variant="outline">Cargador</Badge>}
              {device.otherAccessories && (
                <Badge variant="outline">{device.otherAccessories}</Badge>
              )}
              {!device.hasBackCover &&
                !device.hasBattery &&
                !device.hasSimCard &&
                !device.hasSdCard &&
                !device.hasCharger &&
                !device.otherAccessories && (
                  <p className="text-sm text-muted-foreground">Sin accesorios</p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Condición visual</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Pantalla: </span>
                {device.screenCondition ?? "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Carcasa: </span>
                {device.caseCondition ?? "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Golpes: </span>
                {device.dents ?? "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Rayones: </span>
                {device.scratches ?? "—"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {device.hasPattern && <Badge variant="outline">Patrón</Badge>}
              {device.hasPin && <Badge variant="outline">PIN</Badge>}
              {device.hasFingerprint && <Badge variant="outline">Huella</Badge>}
              {device.patternUnlocked && <Badge variant="outline">Desbloqueado</Badge>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardContent className="pt-6">
              <DeviceImagesGallery deviceId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="space-y-2 pt-6">
              {!deviceAny.reports || deviceAny.reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin informes</p>
              ) : (
                deviceAny.reports.map((r) => (
                  <Link
                    key={r.id}
                    href={`/reports/${r.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="font-mono font-medium">{r.orderNumber}</span>
                    <Badge>{r.currentStatus}</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
