"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usersApi } from "@/lib/api/users";
import type { Role } from "@/types/user";

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  RECEPCIONISTA: "Recepcionista",
  VIEWER: "Visor",
};

const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[];

export function UsersTable() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: ["users", { search, role: roleFilter, page }],
    queryFn: () =>
      usersApi.list({
        search: search || undefined,
        role: roleFilter || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const users = usersQuery.data?.data ?? [];
  const total = usersQuery.data?.meta.total ?? 0;
  const totalPages = usersQuery.data?.meta.totalPages ?? 1;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Usuarios</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as Role | ""); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="">Todos los roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, email o rol..."
            className="sm:max-w-xs"
          />
        </div>
      </CardHeader>

      <CardContent>
        {usersQuery.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}

        {usersQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No fue posible cargar usuarios.
          </div>
        ) : null}

        {!usersQuery.isPending && !usersQuery.isError && users.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
            No hay usuarios para mostrar.
          </div>
        ) : null}

        {!usersQuery.isPending && !usersQuery.isError && users.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell className="text-sm text-slate-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>
                  {total} usuario{total !== 1 ? "s" : ""} &mdash; página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
