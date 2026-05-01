"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customersApi } from "@/lib/api/customers";
import { CreateCustomerModal } from "./create-customer-modal";

const PAGE_SIZE = 20;

export function CustomersTable() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const customersQuery = useQuery({
    queryKey: ["customers", { search, page }],
    queryFn: () => customersApi.list({ search: search || undefined, page, limit: PAGE_SIZE }),
  });

  const customers = customersQuery.data?.data ?? [];
  const total = customersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      {showCreate ? <CreateCustomerModal onClose={() => setShowCreate(false)} /> : null}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Customers</CardTitle>
          <div className="flex gap-2">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por documento, nombre o telefono"
              className="sm:max-w-xs"
            />
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </CardHeader>

      <CardContent>
        {customersQuery.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}

        {customersQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No fue posible cargar clientes.
          </div>
        ) : null}

        {!customersQuery.isPending && !customersQuery.isError && customers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
            No hay clientes para mostrar.
          </div>
        ) : null}

        {!customersQuery.isPending && !customersQuery.isError && customers.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Consent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.documentType} {customer.document}</TableCell>
                      <TableCell className="font-medium">
                        {customer.firstName} {customer.lastName}
                        {customer.secondLastName ? ` ${customer.secondLastName}` : ""}
                      </TableCell>
                      <TableCell>{customer.phone1}</TableCell>
                      <TableCell>{customer.city}</TableCell>
                      <TableCell>
                        <Badge variant={customer.dataConsent ? "default" : "secondary"}>
                          {customer.dataConsent ? "Accepted" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {total} cliente{total !== 1 ? "s" : ""} &mdash; página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
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
          </div>
        ) : null}
      </CardContent>
    </Card>
    </>
  );
}

