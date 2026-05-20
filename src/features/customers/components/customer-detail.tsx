"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ClipboardList,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  User,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  StickyNote,
  CalendarDays,
  Hash,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/reports/status-badge";
import { customersApi } from "@/lib/api/customers";
import { devicesApi } from "@/lib/api/devices";
import { reportsApi } from "@/lib/api/reports";
import type { ReportStatus } from "@/types/report";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm text-foreground">{value ?? "—"}</p>
      </div>
    </div>
  );
}

const ACTIVE_STATUSES: ReportStatus[] = [
  "RECEIVED",
  "IN_DIAGNOSIS",
  "BUDGET_SENT",
  "BUDGET_ACCEPTED",
  "WAITING_PARTS",
  "IN_REPAIR",
  "REPAIRED",
  "TESTING",
  "READY_FOR_PICKUP",
];

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", color)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CustomerDetailProps {
  id: string;
}

export function CustomerDetail({ id }: CustomerDetailProps) {
  const customerQuery = useQuery({
    queryKey: ["customers", id],
    queryFn: () => customersApi.getOne(id),
  });

  const ordersQuery = useQuery({
    queryKey: ["reports", { customerId: id }],
    queryFn: () => reportsApi.list({ customerId: id, limit: 50, sortBy: "createdAt", order: "desc" }),
    enabled: !!id,
  });

  const devicesQuery = useQuery({
    queryKey: ["devices", { customerId: id }],
    queryFn: () => devicesApi.list({ customerId: id, limit: 50 }),
    enabled: !!id,
  });

  if (customerQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (customerQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        No fue posible cargar el cliente.
      </div>
    );
  }

  const customer = customerQuery.data;
  const orders = ordersQuery.data?.data ?? [];
  const devices = devicesQuery.data?.data ?? [];
  const fullName = `${customer.firstName} ${customer.lastName}${customer.secondLastName ? ` ${customer.secondLastName}` : ""}`;

  const initials = [customer.firstName[0], customer.lastName[0]].join("").toUpperCase();

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.currentStatus));
  const deliveredOrders = orders.filter((o) => o.currentStatus === "DELIVERED");
  const urgentOrders = orders.filter((o) => o.isUrgent && ACTIVE_STATUSES.includes(o.currentStatus));

  return (
    <div className="space-y-6">
      {/* ── Profile header ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary/60 to-primary" />
        <CardContent className="flex flex-wrap items-center gap-5 p-5">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {initials}
          </div>

          {/* Name & doc */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-foreground">{fullName}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              {customer.documentType} {customer.document}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Cliente desde{" "}
              {new Date(customer.createdAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Badges & actions */}
          <div className="flex flex-wrap items-center gap-2">
            {customer.dataConsent ? (
              <Badge className="gap-1.5 bg-green-100 text-green-800 hover:bg-green-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Consentimiento aceptado
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <ShieldOff className="h-3.5 w-3.5" />
                Consentimiento pendiente
              </Badge>
            )}
            <Link
              href={`/customers/${customer.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
            <Link
              href={`/reports?customerId=${customer.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ClipboardList className="h-4 w-4" />
              Ver órdenes
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── Metrics strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total órdenes"
          value={ordersQuery.isPending ? <Skeleton className="h-6 w-10" /> : orders.length}
          icon={<ClipboardList className="h-4 w-4 text-primary" />}
          color="bg-primary/10"
        />
        <StatCard
          label="Órdenes activas"
          value={ordersQuery.isPending ? <Skeleton className="h-6 w-10" /> : activeOrders.length}
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          label="Entregadas"
          value={ordersQuery.isPending ? <Skeleton className="h-6 w-10" /> : deliveredOrders.length}
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          label="Urgentes activas"
          value={ordersQuery.isPending ? <Skeleton className="h-6 w-10" /> : urgentOrders.length}
          icon={<AlertTriangle className="h-4 w-4 text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      {/* ── Personal data + Notes ──────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Personal data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              Datos personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Teléfono principal"
                value={customer.phone1}
                icon={<Phone className="h-3.5 w-3.5" />}
              />
              <Field
                label="Teléfono secundario"
                value={customer.phone2}
                icon={<Phone className="h-3.5 w-3.5" />}
              />
            </div>
            <Separator />
            <Field
              label="Email"
              value={
                customer.email ? (
                  <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                    {customer.email}
                  </a>
                ) : null
              }
              icon={<Mail className="h-3.5 w-3.5" />}
            />
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Dirección"
                value={customer.address}
                icon={<MapPin className="h-3.5 w-3.5" />}
              />
              <Field
                label="Ciudad / Provincia"
                value={[customer.city, customer.province].filter(Boolean).join(", ") || null}
                icon={<MapPin className="h-3.5 w-3.5" />}
              />
              <Field label="Código postal" value={customer.postalCode} />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              Notas internas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-[calc(100%-3.5rem)] flex-col">
            {customer.internalNotes ? (
              <p className="flex-1 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {customer.internalNotes}
              </p>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg bg-muted/30 py-8">
                <p className="text-sm text-muted-foreground">Sin notas registradas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Devices ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            Dispositivos registrados
            {!devicesQuery.isPending && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {devices.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devicesQuery.isPending ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin dispositivos registrados</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <Link
                  key={device.id}
                  href={`/devices/${device.id}`}
                  className="group flex flex-col gap-1.5 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">
                      {device.brand?.name ?? "—"}{" "}
                      {device.model ?? ""}
                    </span>
                  </div>
                  {device.imeiIn && (
                    <p className="font-mono text-xs text-muted-foreground">
                      IMEI: {device.imeiIn}
                    </p>
                  )}
                  {device.serialNumber && (
                    <p className="font-mono text-xs text-muted-foreground">
                      S/N: {device.serialNumber}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-1 pt-1">
                    {device.hasSimCard && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">SIM</span>
                    )}
                    {device.hasSdCard && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">SD</span>
                    )}
                    {device.hasCharger && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Cargador</span>
                    )}
                    {device.hasBackCover && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Tapa</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Orders ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Órdenes de reparación
            {!ordersQuery.isPending && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {orders.length}
              </Badge>
            )}
          </CardTitle>
          <Link
            href={`/reports?customerId=${customer.id}`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Ver todas →
          </Link>
        </CardHeader>
        <CardContent>
          {ordersQuery.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin órdenes registradas</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Nº Orden</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 15).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {order.isUrgent ? <span className="mr-1 text-red-500">⚑</span> : null}
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {order.device
                          ? `${order.device.brand?.name ?? ""} ${order.device.model ?? ""}`.trim() || `#${order.deviceId}`
                          : `#${order.deviceId}`}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.currentStatus} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            order.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-800"
                              : order.paymentStatus === "PARTIAL"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {order.paymentStatus === "PAID"
                            ? "Pagado"
                            : order.paymentStatus === "PARTIAL"
                              ? "Parcial"
                              : order.paymentStatus === "REFUNDED"
                                ? "Devuelto"
                                : "Pendiente"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/reports/${order.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Ver
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
