"use client";

import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi } from "@/lib/api/auth";

export default function ProfilePage() {
  const meQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: authApi.me,
  });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Perfil</h1>
        <p className="text-sm text-slate-600">Informacion actual del usuario autenticado.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mi cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {meQuery.isPending ? (
            <>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-36" />
            </>
          ) : null}

          {meQuery.isError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              No fue posible cargar el perfil.
            </p>
          ) : null}

          {meQuery.data ? (
            <>
              <p>
                <span className="font-medium">Nombre:</span> {meQuery.data.firstName} {meQuery.data.lastName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {meQuery.data.email}
              </p>
              <p>
                <span className="font-medium">Rol:</span> {meQuery.data.role}
              </p>
              <p>
                <span className="font-medium">Activo:</span> {meQuery.data.isActive ? "Si" : "No"}
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
