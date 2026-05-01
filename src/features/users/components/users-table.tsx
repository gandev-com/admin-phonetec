"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usersApi } from "@/lib/api/users";

export function UsersTable() {
  const [search, setSearch] = useState("");

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return usersQuery.data ?? [];
    }

    return (usersQuery.data ?? []).filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        user.email.toLowerCase().includes(term) ||
        fullName.includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    });
  }, [usersQuery.data, search]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Users</CardTitle>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, email o rol"
          className="sm:max-w-xs"
        />
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

        {!usersQuery.isPending && !usersQuery.isError && filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
            No hay usuarios para mostrar.
          </div>
        ) : null}

        {!usersQuery.isPending && !usersQuery.isError && filteredUsers.length > 0 ? (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
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
