"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customersApi } from "@/lib/api/customers";

export function CustomersTable() {
  const [search, setSearch] = useState("");

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: customersApi.list,
  });

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return customersQuery.data ?? [];
    }

    return (customersQuery.data ?? []).filter((customer) => {
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      return (
        customer.document.toLowerCase().includes(term) ||
        fullName.includes(term) ||
        customer.phone1.toLowerCase().includes(term)
      );
    });
  }, [customersQuery.data, search]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Customers</CardTitle>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por documento, nombre o telefono"
          className="sm:max-w-xs"
        />
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

        {!customersQuery.isPending && !customersQuery.isError && filteredCustomers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
            No hay clientes para mostrar.
          </div>
        ) : null}

        {!customersQuery.isPending && !customersQuery.isError && filteredCustomers.length > 0 ? (
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
                {filteredCustomers.map((customer) => (
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
        ) : null}
      </CardContent>
    </Card>
  );
}
