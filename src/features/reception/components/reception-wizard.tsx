"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { CustomerSearchBar } from "./customer-search-bar";
import { NewCustomerQuickForm } from "./new-customer-quick-form";
import { BrandModelSelector } from "@/features/devices/components/brand-model-selector";

import { customersApi } from "@/lib/api/customers";
import { devicesApi } from "@/lib/api/devices";
import { reportsApi } from "@/lib/api/reports";
import type { Customer } from "@/types/customer";
import type { Device } from "@/types/device";
import type { Report } from "@/types/report";

// ─── Order creation schema ────────────────────────────────────────────────────

const orderSchema = z.object({
  reportType: z.enum(["REPAIR_ORDER", "BUDGET", "REVISION", "WARRANTY"] as const),
  reportedIssue: z.string().min(1, "Describe el problema"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"] as const),
  isUrgent: z.boolean(),
  estimatedDeliveryDate: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

// ─── Quick device schema ──────────────────────────────────────────────────────

const deviceSchema = z.object({
  brandId: z.string().min(1, "Selecciona una marca"),
  model: z.string().min(1, "El modelo es obligatorio"),
  imeiIn: z.string().optional(),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

// ─── Wizard steps ─────────────────────────────────────────────────────────────

type WizardStep = "search" | "new-customer" | "select-device" | "new-device" | "create-order" | "success";

// ─── Component ────────────────────────────────────────────────────────────────

export function ReceptionWizard() {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>("search");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [createdReport, setCreatedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Devices for the selected customer
  const devicesQuery = useQuery({
    queryKey: ["devices", { customerId: String(customer?.id ?? "") }],
    queryFn: () => devicesApi.list({ customerId: String(customer!.id), limit: 50 }),
    enabled: !!customer,
  });
  const devices = devicesQuery.data?.data ?? [];

  // ─── Order form ─────────────────────────────────────────────────────────────

  const {
    register: registerOrder,
    handleSubmit: handleOrderSubmit,
    control: orderControl,
    formState: { errors: orderErrors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { reportType: "REPAIR_ORDER", priority: "NORMAL", isUrgent: false },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: OrderFormValues) =>
      reportsApi.create({
        ...data,
        customerId: String(customer!.id),
        deviceId: String(selectedDevice!.id),
        estimatedDeliveryDate: data.estimatedDeliveryDate || undefined,
      }),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(`Orden ${report.orderNumber} creada correctamente`);
      setCreatedReport(report);
      setStep("success");
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(detail ? `Error: ${detail}` : "Error al crear la orden");
    },
  });

  // ─── Quick device form ───────────────────────────────────────────────────────

  const {
    register: registerDevice,
    handleSubmit: handleDeviceSubmit,
    control: deviceControl,
    setValue: setDeviceValue,
    formState: { errors: deviceErrors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
  });

  const createDeviceMutation = useMutation({
    mutationFn: (data: DeviceFormValues) =>
      devicesApi.create({
        ...data,
        customerId: String(customer!.id),
        imeiIn: data.imeiIn || undefined,
      }),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success("Dispositivo registrado");
      setSelectedDevice(device);
      setStep("create-order");
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(detail ? `Error: ${detail}` : "Error al registrar el dispositivo");
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleCustomerSelected(c: Customer) {
    setCustomer(c);
    setSelectedDevice(null);
    setStep("select-device");
  }

  function handleNewCustomer(term: string) {
    setSearchTerm(term);
    setStep("new-customer");
  }

  function handleCustomerCreated(c: Customer) {
    setCustomer(c);
    setSelectedDevice(null);
    setStep("select-device");
  }

  function handleDeviceSelected(device: Device) {
    setSelectedDevice(device);
    setStep("create-order");
  }

  function reset() {
    setStep("search");
    setCustomer(null);
    setSelectedDevice(null);
    setCreatedReport(null);
    setSearchTerm("");
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <StepCrumb active={step === "search"} done={step !== "search"} label="Buscar cliente" />
        <ChevronRight className="h-3 w-3" />
        <StepCrumb
          active={step === "new-customer" || step === "select-device" || step === "new-device"}
          done={step === "create-order" || step === "success"}
          label="Dispositivo"
        />
        <ChevronRight className="h-3 w-3" />
        <StepCrumb
          active={step === "create-order"}
          done={step === "success"}
          label="Orden"
        />
      </nav>

      {/* Step: Search */}
      {step === "search" && (
        <Card>
          <CardHeader>
            <CardTitle>Buscar cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSearchBar onSelect={handleCustomerSelected} onCreateNew={handleNewCustomer} />
          </CardContent>
        </Card>
      )}

      {/* Step: New Customer */}
      {step === "new-customer" && (
        <NewCustomerQuickForm
          initialName={searchTerm}
          onSuccess={handleCustomerCreated}
          onCancel={() => setStep("search")}
        />
      )}

      {/* Step: Select Device */}
      {(step === "select-device" || step === "new-device") && customer && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dispositivo</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Cliente: {customer.firstName} {customer.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("search")}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Cambiar cliente
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "select-device" && (
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
                          onClick={() => handleDeviceSelected(device)}
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

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep("new-device")}
                >
                  + Registrar nuevo dispositivo
                </Button>
              </>
            )}

            {step === "new-device" && (
              <form
                onSubmit={handleDeviceSubmit((data) => createDeviceMutation.mutate(data))}
                className="space-y-4"
              >
                <Controller
                  control={deviceControl}
                  name="brandId"
                  render={({ field }) => (
                    <BrandModelSelector
                      brandId={field.value}
                      modelValue={undefined}
                      onBrandChange={(id) => {
                        field.onChange(id);
                        setDeviceValue("model", "");
                      }}
                      onModelChange={(model) => setDeviceValue("model", model)}
                      brandError={deviceErrors.brandId?.message}
                      modelError={deviceErrors.model?.message}
                    />
                  )}
                />

                <div className="space-y-1">
                  <Label htmlFor="dev-imei">IMEI (opcional)</Label>
                  <Input id="dev-imei" {...registerDevice("imeiIn")} placeholder="15 dígitos" maxLength={15} />
                  {deviceErrors.imeiIn && (
                    <p className="text-xs text-destructive">{deviceErrors.imeiIn.message}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("select-device")}
                  >
                    Volver
                  </Button>
                  <Button type="submit" disabled={createDeviceMutation.isPending} className="flex-1">
                    {createDeviceMutation.isPending ? "Guardando…" : "Registrar dispositivo"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Create Order */}
      {step === "create-order" && customer && selectedDevice && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Nueva orden</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {customer.firstName} {customer.lastName} ·{" "}
                  {selectedDevice.brand?.name} {selectedDevice.model}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("select-device")}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Cambiar dispositivo
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleOrderSubmit((data) => createOrderMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo de orden *</Label>
                  <Controller
                    control={orderControl}
                    name="reportType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REPAIR_ORDER">Reparación</SelectItem>
                          <SelectItem value="BUDGET">Presupuesto</SelectItem>
                          <SelectItem value="REVISION">Revisión</SelectItem>
                          <SelectItem value="WARRANTY">Garantía</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Prioridad *</Label>
                  <Controller
                    control={orderControl}
                    name="priority"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Baja</SelectItem>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="HIGH">Alta</SelectItem>
                          <SelectItem value="URGENT">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="issue">Problema reportado *</Label>
                <Textarea
                  id="issue"
                  {...registerOrder("reportedIssue")}
                  placeholder="Describe el problema del dispositivo…"
                  rows={3}
                />
                {orderErrors.reportedIssue && (
                  <p className="text-xs text-destructive">{orderErrors.reportedIssue.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="edd">Entrega estimada</Label>
                <Input
                  id="edd"
                  type="date"
                  {...registerOrder("estimatedDeliveryDate")}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isUrgent"
                  type="checkbox"
                  {...registerOrder("isUrgent")}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="isUrgent" className="cursor-pointer text-sm font-normal">
                  Marcar como urgente
                </Label>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("select-device")}
                >
                  Volver
                </Button>
                <Button type="submit" disabled={createOrderMutation.isPending} className="flex-1">
                  {createOrderMutation.isPending ? "Creando…" : "Crear orden"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step: Success */}
      {step === "success" && createdReport && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                Orden {createdReport.orderNumber} creada
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                La recepción ha sido registrada correctamente.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>
                Nueva recepción
              </Button>
              <Link
                href={`/reports/${createdReport.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
              >
                Ver orden
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────

function StepCrumb({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={
        done
          ? "text-green-600 font-medium"
          : active
            ? "text-foreground font-medium"
            : "text-muted-foreground"
      }
    >
      {label}
    </span>
  );
}
