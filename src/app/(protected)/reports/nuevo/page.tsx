"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronRight, ChevronLeft, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { customersApi } from "@/lib/api/customers";
import { devicesApi } from "@/lib/api/devices";
import { brandsApi } from "@/lib/api/brands";
import { reportsApi } from "@/lib/api/reports";
import type { Customer } from "@/types/customer";
import type { Device } from "@/types/device";

// ─── Wizard state ─────────────────────────────────────────────────────────────

interface WizardData {
  customerId: string;
  deviceId: string;
  reportType: "REPAIR_ORDER" | "BUDGET" | "REVISION" | "WARRANTY";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  isUrgent: boolean;
  reportedIssue: string;
  entryCondition: string;
  initialBudget: string;
  internalNotes: string;
}

const STEPS = [
  { id: 1, title: "Cliente", description: "Seleccionar cliente" },
  { id: 2, title: "Dispositivo", description: "Seleccionar dispositivo" },
  { id: 3, title: "Avería", description: "Descripción del problema" },
  { id: 4, title: "Resumen", description: "Confirmar y crear" },
];

// ─── Step 1: Customer ─────────────────────────────────────────────────────────

function StepCustomer({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["customers", { search: debouncedSearch }],
    queryFn: () => customersApi.list({ search: debouncedSearch || undefined, limit: 8 }),
  });

  const customers = query.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, documento o teléfono..."
          className="pl-9"
        />
      </div>

      {query.isPending ? (
        <p className="py-4 text-center text-sm text-slate-400">Buscando...</p>
      ) : null}

      <div className="space-y-2">
        {customers.map((customer: Customer) => {
          const fullName = `${customer.firstName} ${customer.lastName}${customer.secondLastName ? ` ${customer.secondLastName}` : ""}`;
          const isSelected = value === String(customer.id);
          return (
            <button
              key={customer.id}
              type="button"
              onClick={() => onChange(String(customer.id))}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left transition-all",
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <p className="text-sm font-medium">{fullName}</p>
              <p className={cn("text-xs mt-0.5", isSelected ? "text-slate-300" : "text-slate-500")}>
                {customer.documentType} {customer.document} · {customer.phone1}
              </p>
            </button>
          );
        })}
      </div>

      {!query.isPending && customers.length === 0 && debouncedSearch ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No se encontraron clientes. Busca con otro término.
        </p>
      ) : null}
    </div>
  );
}

// ─── Step 2: Device ───────────────────────────────────────────────────────────

function StepDevice({
  customerId,
  value,
  onChange,
}: {
  customerId: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const query = useQuery({
    queryKey: ["devices", { customerId }],
    queryFn: () => devicesApi.list({ customerId, limit: 20 }),
    enabled: !!customerId,
  });

  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandsApi.list(),
    staleTime: 60_000,
  });

  const devices = query.data?.data ?? [];
  const brands = brandsQuery.data ?? [];

  function getBrandName(brandId: number | string) {
    return brands.find((b) => String(b.id) === String(brandId))?.name ?? `#${brandId}`;
  }

  return (
    <div className="space-y-3">
      {query.isPending ? (
        <p className="py-4 text-center text-sm text-slate-400">Cargando dispositivos...</p>
      ) : null}

      {!query.isPending && devices.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
          Este cliente no tiene dispositivos registrados.
        </div>
      ) : null}

      {devices.map((device: Device) => {
        const brandName = device.brand?.name ?? getBrandName(device.brandId);
        const label = `${brandName} ${device.model ?? ""}`.trim() || `Dispositivo #${device.id}`;
        const isSelected = value === String(device.id);
        return (
          <button
            key={device.id}
            type="button"
            onClick={() => onChange(String(device.id))}
            className={cn(
              "w-full rounded-xl border px-4 py-3 text-left transition-all",
              isSelected
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <p className="text-sm font-medium">{label}</p>
            <p className={cn("mt-0.5 text-xs", isSelected ? "text-slate-300" : "text-slate-500")}>
              {[device.imeiIn && `IMEI: ${device.imeiIn}`, device.serialNumber && `S/N: ${device.serialNumber}`]
                .filter(Boolean)
                .join(" · ") || "Sin IMEI ni número de serie"}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 3: Issue form ───────────────────────────────────────────────────────

const issueSchema = z.object({
  reportType: z.enum(["REPAIR_ORDER", "BUDGET", "REVISION", "WARRANTY"] as const),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"] as const),
  isUrgent: z.boolean(),
  reportedIssue: z.string().min(3, "Describe la avería (mín. 3 caracteres)"),
  entryCondition: z.string().optional(),
  initialBudget: z.string().optional(),
  internalNotes: z.string().optional(),
});

type IssueFormValues = z.infer<typeof issueSchema>;

function StepIssue({
  value,
  onChange,
}: {
  value: Partial<IssueFormValues>;
  onChange: (v: IssueFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      reportType: "REPAIR_ORDER",
      priority: "NORMAL",
      isUrgent: false,
      ...value,
    },
  });

  return (
    <form id="step3-form" onSubmit={handleSubmit(onChange)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Tipo de orden</label>
          <select
            {...register("reportType")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            <option value="REPAIR_ORDER">Reparación</option>
            <option value="BUDGET">Presupuesto</option>
            <option value="REVISION">Revisión</option>
            <option value="WARRANTY">Garantía</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Prioridad</label>
          <select
            {...register("priority")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            <option value="LOW">Baja</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="isUrgent" {...register("isUrgent")} className="rounded" />
        <label htmlFor="isUrgent" className="text-sm text-slate-700">Marcar como urgente</label>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-700">Descripción de la avería *</label>
        <textarea
          {...register("reportedIssue")}
          rows={3}
          placeholder="Describe el problema reportado por el cliente..."
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
        {errors.reportedIssue ? (
          <p className="text-xs text-red-600">{errors.reportedIssue.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-700">Estado de entrada</label>
        <textarea
          {...register("entryCondition")}
          rows={2}
          placeholder="Condición física del dispositivo al recibirlo..."
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Presupuesto inicial (€)</label>
          <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("initialBudget")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-700">Notas internas</label>
        <textarea
          {...register("internalNotes")}
          rows={2}
          placeholder="Notas solo visibles para el taller..."
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </div>
    </form>
  );
}

// ─── Step 4: Summary ──────────────────────────────────────────────────────────

function StepSummary({ data }: { data: WizardData }) {
  const customerQuery = useQuery({
    queryKey: ["customers", data.customerId],
    queryFn: () => customersApi.getOne(data.customerId),
    enabled: !!data.customerId,
  });

  const deviceQuery = useQuery({
    queryKey: ["devices", data.deviceId],
    queryFn: () => devicesApi.getOne(data.deviceId),
    enabled: !!data.deviceId,
  });

  const customer = customerQuery.data;
  const device = deviceQuery.data;

  const TYPE_LABELS: Record<string, string> = {
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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</p>
          {customer ? (
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.firstName} {customer.lastName} {customer.secondLastName}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">ID: {data.customerId}</p>
          )}
        </div>

        <div className="rounded-xl border bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dispositivo</p>
          {device ? (
            <p className="mt-1 text-sm font-medium text-slate-900">
              {device.brand?.name ?? ""} {device.model ?? ""}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">ID: {data.deviceId}</p>
          )}
        </div>

        <div className="rounded-xl border bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo / Prioridad</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {TYPE_LABELS[data.reportType]} · {PRIORITY_LABELS[data.priority]}
            {data.isUrgent ? " · ⚑ Urgente" : ""}
          </p>
        </div>

        {data.initialBudget ? (
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Presupuesto inicial</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {parseFloat(data.initialBudget).toFixed(2)} €
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avería reportada</p>
        <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{data.reportedIssue || "—"}</p>
      </div>

      {data.entryCondition ? (
        <div className="rounded-xl border bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado de entrada</p>
          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{data.entryCondition}</p>
        </div>
      ) : null}
    </div>
  );
}

// ─── Wizard page ──────────────────────────────────────────────────────────────

export default function NuevoInformePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    customerId: "",
    deviceId: "",
    reportType: "REPAIR_ORDER",
    priority: "NORMAL",
    isUrgent: false,
    reportedIssue: "",
    entryCondition: "",
    initialBudget: "",
    internalNotes: "",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      reportsApi.create({
        customerId: data.customerId,
        deviceId: data.deviceId,
        reportType: data.reportType,
        priority: data.priority,
        isUrgent: data.isUrgent,
        reportedIssue: data.reportedIssue || undefined,
        entryCondition: data.entryCondition || undefined,
        initialBudget: data.initialBudget ? parseFloat(data.initialBudget) : undefined,
        internalNotes: data.internalNotes || undefined,
      }),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Orden creada correctamente");
      router.push(`/reports/${report.id}`);
    },
    onError: () => {
      toast.error("Error al crear la orden");
    },
  });

  function canNext() {
    if (step === 1) return !!data.customerId;
    if (step === 2) return !!data.deviceId;
    return true;
  }

  function handleIssueSubmit(values: IssueFormValues) {
    setData((prev) => ({
      ...prev,
      reportType: values.reportType,
      priority: values.priority,
      isUrgent: values.isUrgent,
      reportedIssue: values.reportedIssue,
      entryCondition: values.entryCondition ?? "",
      initialBudget: values.initialBudget ?? "",
      internalNotes: values.internalNotes ?? "",
    }));
    setStep(4);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Nueva orden de reparación</h1>
        <p className="text-sm text-slate-500">Completa los datos en 4 pasos.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                  step > s.id && "border-slate-900 bg-slate-900 text-white",
                  step === s.id && "border-slate-900 text-slate-900",
                  step < s.id && "border-slate-300 text-slate-400",
                )}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <p
                className={cn(
                  "mt-1 hidden text-xs sm:block",
                  step === s.id ? "font-medium text-slate-900" : "text-slate-400",
                )}
              >
                {s.title}
              </p>
            </div>
            {idx < STEPS.length - 1 ? (
              <div className={cn("mx-2 h-0.5 flex-1 transition-all", step > s.id ? "bg-slate-900" : "bg-slate-200")} />
            ) : null}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{STEPS[step - 1].description}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <StepCustomer value={data.customerId} onChange={(id) => setData((p) => ({ ...p, customerId: id }))} />
          ) : null}
          {step === 2 ? (
            <StepDevice
              customerId={data.customerId}
              value={data.deviceId}
              onChange={(id) => setData((p) => ({ ...p, deviceId: id }))}
            />
          ) : null}
          {step === 3 ? (
            <StepIssue
              value={{ reportType: data.reportType, priority: data.priority, isUrgent: data.isUrgent, reportedIssue: data.reportedIssue, entryCondition: data.entryCondition, initialBudget: data.initialBudget, internalNotes: data.internalNotes }}
              onChange={handleIssueSubmit}
            />
          ) : null}
          {step === 4 ? <StepSummary data={data} /> : null}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1 || createMutation.isPending}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : step === 3 ? (
          <Button type="submit" form="step3-form">
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="min-w-36"
          >
            {createMutation.isPending ? "Creando..." : "Crear orden"}
          </Button>
        )}
      </div>
    </section>
  );
}
