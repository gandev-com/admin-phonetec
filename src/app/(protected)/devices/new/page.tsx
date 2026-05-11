"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { DeviceForm } from "@/features/devices/components/device-form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customersApi } from "@/lib/api/customers";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { Customer } from "@/types/customer";

// ─── Customer picker ──────────────────────────────────────────────────────────

function CustomerPicker({ onSelect }: { onSelect: (id: string, name: string) => void }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const query = useQuery({
    queryKey: ["customers", { search: debouncedSearch }],
    queryFn: () => customersApi.list({ search: debouncedSearch || undefined, limit: 8 }),
  });

  const customers: Customer[] = query.data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleccionar cliente</CardTitle>
        <p className="text-sm text-muted-foreground">
          El dispositivo debe estar asociado a un cliente existente.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, documento o teléfono…"
            className="pl-9"
            autoFocus
          />
        </div>
        {query.isPending && (
          <p className="py-4 text-center text-sm text-muted-foreground">Buscando…</p>
        )}
        <ul className="space-y-2">
          {customers.map((c) => {
            const fullName = [c.firstName, c.lastName, c.secondLastName].filter(Boolean).join(" ");
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(String(c.id), fullName)}
                  className="w-full rounded-xl border px-4 py-3 text-left transition-colors hover:border-ring hover:bg-muted"
                >
                  <p className="text-sm font-medium">{fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.documentType} {c.document} · {c.phone1}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
        {!query.isPending && customers.length === 0 && search.length > 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No se encontraron clientes para &ldquo;{search}&rdquo;
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

function NewDeviceContent() {
  const params = useSearchParams();
  const urlCustomerId = params.get("customerId") ?? "";

  const [customerId, setCustomerId] = useState(urlCustomerId);
  const [customerName, setCustomerName] = useState("");

  if (!customerId) {
    return (
      <CustomerPicker
        onSelect={(id, name) => {
          setCustomerId(id);
          setCustomerName(name);
        }}
      />
    );
  }

  return (
    <>
      {customerName && (
        <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Cliente: </span>
            <span className="font-medium">{customerName}</span>
          </p>
          <button
            type="button"
            onClick={() => { setCustomerId(""); setCustomerName(""); }}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Cambiar
          </button>
        </div>
      )}
      <DeviceForm customerId={customerId} />
    </>
  );
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
