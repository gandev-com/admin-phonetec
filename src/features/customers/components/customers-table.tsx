"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customersApi } from "@/lib/api/customers";
import { CreateCustomerModal } from "./create-customer-modal";

const PAGE_SIZE = 20;

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

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
  const total = customersQuery.data?.meta.total ?? 0;
  const totalPages = customersQuery.data?.meta.totalPages ?? 1;

  return (
    <>
      {showCreate ? <CreateCustomerModal onClose={() => setShowCreate(false)} /> : null}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Clientes</CardTitle>
          <div className="flex gap-2">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por documento, nombre o teléfono..."
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
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : null}

          {customersQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              No fue posible cargar clientes.
            </div>
          ) : null}

          {!customersQuery.isPending && !customersQuery.isError && customers.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No hay clientes para mostrar.
            </div>
          ) : null}

          {!customersQuery.isPending && !customersQuery.isError && customers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
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
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Cliente</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Consentimiento</TableHead>
                      <TableHead className="w-20">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                                {getInitials(customer.firstName, customer.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {customer.firstName} {customer.lastName}
                                {customer.secondLastName ? ` ${customer.secondLastName}` : ""}
                              </p>
                              {customer.email ? (
                                <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          <span className="text-xs font-medium text-muted-foreground">{customer.documentType} </span>
                          {customer.document}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">{customer.phone1}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {[customer.city, customer.province].filter(Boolean).join(", ") || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.dataConsent ? "default" : "secondary"}>
                            {customer.dataConsent ? "Aceptado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/customers/${customer.id}`}
                            className={buttonVariants({ variant: "ghost", size: "icon" })}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

