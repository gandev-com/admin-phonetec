"use client";

import { PlusCircle, Search, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useBrands } from "@/features/devices/hooks/use-brands";
import type { Brand, Device } from "@/types/device";

interface DevicesTableProps {
  customerId?: string;
}

export function DevicesTable({ customerId }: DevicesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDevices({ search, customerId, brandId, page, limit: 20 });
  const { data: brands = [] } = useBrands();

  const devices: Device[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data ? Math.ceil(data.total / (data.limit || 20)) : 1;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por modelo, IMEI..."
              className="pl-9"
            />
          </div>
          <Select
            value={brandId ?? "all"}
            onValueChange={(v) => {
              setBrandId(!v || v === "all" ? undefined : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todas las marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {(brands as Brand[]).map((b) => (
                <SelectItem key={String(b.id)} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link
          href={customerId ? `/devices/new?customerId=${customerId}` : "/devices/new"}
          className={buttonVariants()}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo dispositivo
        </Link>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispositivo</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Informes</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  <Smartphone className="mx-auto mb-2 h-8 w-8" />
                  No se encontraron dispositivos
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <TableRow
                  key={String(device.id)}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/devices/${String(device.id)}`)}
                >
                  <TableCell>
                    <div className="font-medium">
                      {device.brand?.name} {device.model}
                    </div>
                    {device.serialNumber && (
                      <div className="text-xs text-muted-foreground">
                        S/N: {device.serialNumber}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {device.imeiIn ?? "—"}
                  </TableCell>
                  <TableCell>
                    {(device as unknown as { customer?: { firstName: string; lastName: string } })
                      .customer
                      ? `${(device as unknown as { customer: { firstName: string; lastName: string } }).customer.firstName} ${(device as unknown as { customer: { firstName: string; lastName: string } }).customer.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {(device as unknown as { _count?: { reports: number } })._count
                        ?.reports ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/devices/${String(device.id)}/edit`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Editar
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} dispositivos en total</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
