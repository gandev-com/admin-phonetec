"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/reports/status-badge";
import { customersApi } from "@/lib/api/customers";
import { reportsApi } from "@/lib/api/reports";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value ?? "—"}</p>
    </div>
  );
}

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
    queryFn: () => reportsApi.list({ customerId: id, limit: 10, sortBy: "createdAt", order: "desc" }),
    enabled: !!id,
  });

  if (customerQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
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
  const fullName = `${customer.firstName} ${customer.lastName}${customer.secondLastName ? ` ${customer.secondLastName}` : ""}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{fullName}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {customer.documentType} {customer.document}
          </p>
        </div>
        <Badge variant={customer.dataConsent ? "default" : "secondary"}>
          {customer.dataConsent ? "Consentimiento aceptado" : "Consentimiento pendiente"}
        </Badge>
      </div>

      {/* Personal data */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Nombre completo" value={fullName} />
            <Field label="Documento" value={`${customer.documentType} ${customer.document}`} />
            <Field label="Teléfono principal" value={customer.phone1} />
            <Field label="Teléfono secundario" value={customer.phone2} />
            <Field label="Email" value={customer.email} />
            <Field label="Código postal" value={customer.postalCode} />
            <Field label="Dirección" value={customer.address} />
            <Field
              label="Ciudad / Provincia"
              value={[customer.city, customer.province].filter(Boolean).join(", ") || null}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notas internas</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.internalNotes ? (
              <p className="whitespace-pre-wrap text-sm text-slate-700">{customer.internalNotes}</p>
            ) : (
              <p className="text-sm text-slate-400">Sin notas registradas</p>
            )}
            <p className="mt-4 text-xs text-slate-400">
              Cliente desde {new Date(customer.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardList className="h-4 w-4" />
            Órdenes de reparación
          </CardTitle>
          <Link
            href={`/reports?customerId=${customer.id}`}
            className="text-xs font-medium text-slate-500 hover:text-slate-900"
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
          ) : null}

          {!ordersQuery.isPending && orders.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Sin órdenes registradas</p>
          ) : null}

          {!ordersQuery.isPending && orders.length > 0 ? (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Nº Orden</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {order.isUrgent ? <span className="mr-1 text-red-500">⚑</span> : null}
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {order.device
                          ? `${order.device.brand?.name ?? ""} ${order.device.model ?? ""}`.trim() || `#${order.deviceId}`
                          : `#${order.deviceId}`}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.currentStatus} />
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/reports/${order.id}`}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Ver
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
