"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle2, ChevronRight, FileText, Mail, MapPin, PenLine, Phone, Printer, Smartphone, StickyNote, User } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import { SignaturePad, type SignaturePadHandle } from "@/components/shared/signature-pad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

type WizardStep = "search" | "new-customer" | "select-device" | "new-device" | "create-order" | "sign-reception" | "success";
// ─── Display labels ─────────────────────────────────────────────────────────────────────

const ORDER_TYPE_LABELS: Record<string, string> = {
  REPAIR_ORDER: "Reparación",
  BUDGET: "Presupuesto",
  REVISION: "Revisión",
  WARRANTY: "Garantía",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};
// ─── Component ────────────────────────────────────────────────────────────────

export function ReceptionWizard() {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>("search");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [createdReport, setCreatedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [receptionSignedBy, setReceptionSignedBy] = useState("");
  const [padEmpty, setPadEmpty] = useState(true);
  const [pendingOrderData, setPendingOrderData] = useState<OrderFormValues | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const receptionPadRef = useRef<SignaturePadHandle>(null);

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
  });

  // ─── Quick device form ───────────────────────────────────────────────────────

  const {    register: registerDevice,
    handleSubmit: handleDeviceSubmit,
    control: deviceControl,
    setValue: setDeviceValue,
    formState: { errors: deviceErrors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
  });

  const deviceModelValue = useWatch({ control: deviceControl, name: 'model' });

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

  const signReceptionMutation = useMutation({
    mutationFn: ({ reportId, file, signedBy }: { reportId: number | string; file: File; signedBy: string }) =>
      reportsApi.signReception(reportId, file, signedBy),
  });

  async function handleSignAndCreate() {
    if (!pendingOrderData || !customer || !selectedDevice) return;

    const file = receptionPadRef.current?.toFile(
      `firma-recepcion-${customer.firstName}-${Date.now()}.png`,
    );
    const dataUrl = receptionPadRef.current?.toDataUrl();
    if (!file || !dataUrl) return;

    setSignatureDataUrl(dataUrl);

    try {
      const report = await createOrderMutation.mutateAsync(pendingOrderData);
      setCreatedReport(report);
      await signReceptionMutation.mutateAsync({
        reportId: report.id,
        file,
        signedBy: receptionSignedBy.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(`Orden ${report.orderNumber} creada y firmada correctamente`);
      setStep("success");
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(detail ? `Error: ${detail}` : "No se pudo completar la recepción");
    }
  }

  function reset() {
    setStep("search");
    setCustomer(null);
    setSelectedDevice(null);
    setCreatedReport(null);
    setSearchTerm("");
    setReceptionSignedBy("");
    setPadEmpty(true);
    setPendingOrderData(null);
    setSignatureDataUrl(null);
    receptionPadRef.current?.clear();
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
          done={step === "create-order" || step === "sign-reception" || step === "success"}
          label="Dispositivo"
        />
        <ChevronRight className="h-3 w-3" />
        <StepCrumb
          active={step === "create-order"}
          done={step === "sign-reception" || step === "success"}
          label="Orden"
        />
        <ChevronRight className="h-3 w-3" />
        <StepCrumb
          active={step === "sign-reception"}
          done={step === "success"}
          label="Firma"
        />
      </nav>

      {/* Step: Search */}
      {step === "search" && (
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Buscar cliente</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
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
              <CardTitle>Dispositivo</CardTitle>
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
            <CustomerInfoCard customer={customer} />
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
                      modelValue={deviceModelValue || undefined}
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
              <CardTitle>Nueva orden</CardTitle>
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
            <div className="space-y-4">
              <CustomerInfoCard customer={customer} />

              {/* Device summary */}
              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {selectedDevice.brand?.name} {selectedDevice.model}
                  </p>
                  {selectedDevice.imeiIn ? (
                    <p className="text-xs text-muted-foreground">IMEI: {selectedDevice.imeiIn}</p>
                  ) : null}
                </div>
              </div>

            <form
              onSubmit={handleOrderSubmit((data) => {
                setPendingOrderData(data);
                setReceptionSignedBy(customer ? `${customer.firstName} ${customer.lastName}` : "");
                setStep("sign-reception");
              })}
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
                          <SelectValue>{ORDER_TYPE_LABELS[field.value]}</SelectValue>
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
                          <SelectValue>{PRIORITY_LABELS[field.value]}</SelectValue>
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
                <Button type="submit" className="flex-1">
                  Siguiente →
                </Button>
              </div>
            </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Sign Reception */}
      {step === "sign-reception" && customer && selectedDevice && pendingOrderData && (
        <div className="space-y-4">
          {/* Document preview */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Documento de recepción</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Phonetec · {new Date().toLocaleDateString("es-ES", { dateStyle: "long" })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {/* Customer */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</p>
                <CustomerInfoCard customer={customer} />
              </div>

              <Separator />

              {/* Device */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dispositivo</p>
                <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                  <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {selectedDevice.brand?.name} {selectedDevice.model}
                    </p>
                    {selectedDevice.imeiIn ? (
                      <p className="text-xs text-muted-foreground">IMEI: {selectedDevice.imeiIn}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order details */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detalles de la orden</p>
                <dl className="space-y-1.5 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-muted-foreground">Tipo:</dt>
                    <dd className="font-medium">{ORDER_TYPE_LABELS[pendingOrderData.reportType]}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-muted-foreground">Prioridad:</dt>
                    <dd className="font-medium">{PRIORITY_LABELS[pendingOrderData.priority]}</dd>
                  </div>
                  {pendingOrderData.isUrgent && (
                    <div className="flex gap-2">
                      <dt className="w-32 shrink-0 text-muted-foreground">Urgente:</dt>
                      <dd className="font-medium text-red-600">Sí</dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-muted-foreground">Problema:</dt>
                    <dd>{pendingOrderData.reportedIssue}</dd>
                  </div>
                  {pendingOrderData.estimatedDeliveryDate && (
                    <div className="flex gap-2">
                      <dt className="w-32 shrink-0 text-muted-foreground">Entrega est.:</dt>
                      <dd>
                        {new Date(pendingOrderData.estimatedDeliveryDate + "T12:00:00").toLocaleDateString("es-ES")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <Separator />

              {/* Consent clause */}
              <div className="rounded-lg border bg-amber-50/50 p-3 text-xs text-muted-foreground dark:bg-amber-950/20">
                <p className="mb-1 font-semibold text-foreground">Cláusula de consentimiento</p>
                <p>
                  El cliente declara que los datos anteriores son correctos y autoriza al taller a
                  realizar el diagnóstico y/o reparación del dispositivo descrito. El taller no se
                  responsabiliza de la pérdida de datos contenidos en el dispositivo. El presupuesto
                  de reparación será comunicado antes de iniciar cualquier trabajo.
                </p>
              </div>

              {/* Signature */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Firma del cliente</p>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground" htmlFor="sign-by">
                    Nombre del firmante *
                  </label>
                  <input
                    id="sign-by"
                    value={receptionSignedBy}
                    onChange={(e) => setReceptionSignedBy(e.target.value)}
                    placeholder="Nombre completo del cliente"
                    className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-ring"
                  />
                </div>
                <SignaturePad
                  ref={receptionPadRef}
                  height={200}
                  onChange={(isEmpty) => setPadEmpty(isEmpty)}
                />
              </div>

              {(createOrderMutation.isError || signReceptionMutation.isError) && (
                <p className="text-sm text-destructive">
                  {createOrderMutation.isError
                    ? "No se pudo crear la orden. Comprueba la conexión e inténtalo de nuevo."
                    : "La orden fue creada pero no se pudo guardar la firma. Por favor, inténtalo de nuevo."}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                receptionPadRef.current?.clear();
                setPadEmpty(true);
                setStep("create-order");
              }}
              disabled={createOrderMutation.isPending || signReceptionMutation.isPending}
            >
              Volver
            </Button>
            <Button
              onClick={handleSignAndCreate}
              disabled={
                padEmpty ||
                !receptionSignedBy.trim() ||
                createOrderMutation.isPending ||
                signReceptionMutation.isPending
              }
              className="flex-1"
            >
              <PenLine className="h-4 w-4" />
              {createOrderMutation.isPending
                ? "Creando orden…"
                : signReceptionMutation.isPending
                  ? "Guardando firma…"
                  : "Firmar y crear orden"}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && createdReport && customer && selectedDevice && pendingOrderData && (
        <div className="space-y-4">
          {/* Success header */}
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div>
                <p className="text-lg font-semibold text-foreground">Recepción completada</p>
                <p className="font-mono text-sm text-muted-foreground">{createdReport.orderNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Printable receipt */}
          <Card id="reception-receipt">
            <CardHeader className="border-b pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Phonetec</CardTitle>
                  <p className="text-sm text-muted-foreground">Taller de reparación</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-mono font-bold">{createdReport.orderNumber}</p>
                  <p className="text-muted-foreground">
                    {new Date().toLocaleDateString("es-ES", { dateStyle: "medium" })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {/* Customer */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</p>
                <CustomerInfoCard customer={customer} />
              </div>

              <Separator />

              {/* Device */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dispositivo</p>
                <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                  <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {selectedDevice.brand?.name} {selectedDevice.model}
                    </p>
                    {selectedDevice.imeiIn ? (
                      <p className="text-xs text-muted-foreground">IMEI: {selectedDevice.imeiIn}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order details */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detalles de la orden</p>
                <dl className="space-y-1.5 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-muted-foreground">Tipo:</dt>
                    <dd className="font-medium">{ORDER_TYPE_LABELS[pendingOrderData.reportType]}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-muted-foreground">Prioridad:</dt>
                    <dd className="font-medium">{PRIORITY_LABELS[pendingOrderData.priority]}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-muted-foreground">Problema:</dt>
                    <dd>{pendingOrderData.reportedIssue}</dd>
                  </div>
                  {pendingOrderData.estimatedDeliveryDate && (
                    <div className="flex gap-2">
                      <dt className="w-32 shrink-0 text-muted-foreground">Entrega est.:</dt>
                      <dd>
                        {new Date(pendingOrderData.estimatedDeliveryDate + "T12:00:00").toLocaleDateString("es-ES")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <Separator />

              {/* Consent clause */}
              <div className="rounded-lg border bg-amber-50/50 p-3 text-xs text-muted-foreground dark:bg-amber-950/20">
                <p className="mb-1 font-semibold text-foreground">Cláusula de consentimiento</p>
                <p>
                  El cliente declara que los datos anteriores son correctos y autoriza al taller a
                  realizar el diagnóstico y/o reparación del dispositivo descrito. El taller no se
                  responsabiliza de la pérdida de datos contenidos en el dispositivo.
                </p>
              </div>

              {/* Signature image */}
              {signatureDataUrl && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Firma del cliente</p>
                  <div className="rounded-xl border bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signatureDataUrl}
                      alt="Firma del cliente"
                      className="h-24 w-auto max-w-full"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Firmado por: <span className="font-medium text-foreground">{receptionSignedBy}</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={reset}>
              Nueva recepción
            </Button>
            <Link
              href={`/reports/${createdReport.id}`}
              className={buttonVariants({ variant: "default" })}
            >
              Ver orden
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Customer info card ────────────────────────────────────────────────────────

function CustomerInfoCard({ customer }: { customer: Customer }) {
  const fullName = [customer.firstName, customer.lastName, customer.secondLastName]
    .filter(Boolean)
    .join(" ");
  const initials = `${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`.toUpperCase();
  const location = [customer.address, customer.postalCode, customer.city, customer.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      {/* Name + doc + profile link */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{fullName}</p>
            <p className="text-xs text-muted-foreground">
              {customer.documentType} {customer.document}
            </p>
          </div>
        </div>
        <Link
          href={`/customers/${customer.id}`}
          target="_blank"
          className={buttonVariants({ variant: "ghost", size: "xs" })}
        >
          <User className="h-3 w-3" />
          Perfil
        </Link>
      </div>

      <Separator />

      {/* Contact grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground">{customer.phone1}</span>
        </div>

        {customer.phone2 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground">{customer.phone2}</span>
            <span className="text-muted-foreground">(alt.)</span>
          </div>
        ) : null}

        {customer.email ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-foreground">{customer.email}</span>
          </div>
        ) : null}

        {location ? (
          <div className="flex items-start gap-2 text-xs text-muted-foreground sm:col-span-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground">{location}</span>
          </div>
        ) : null}
      </div>

      {/* Internal notes */}
      {customer.internalNotes ? (
        <>
          <Separator />
          <div className="flex items-start gap-2 text-xs">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="text-muted-foreground">{customer.internalNotes}</p>
          </div>
        </>
      ) : null}
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
