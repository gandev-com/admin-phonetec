"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { partsApi } from "@/lib/api/parts";

const PAGE_SIZE = 20;

export function PartsTable() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const partsQuery = useQuery({
    queryKey: ["parts", { search, category, page }],
    queryFn: () =>
      partsApi.list({
        search: search || undefined,
        category: category || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const categoriesQuery = useQuery({
    queryKey: ["parts", "categories"],
    queryFn: partsApi.getCategories,
    staleTime: 60_000,
  });

  const lowStockQuery = useQuery({
    queryKey: ["parts", "low-stock-count"],
    queryFn: () => partsApi.getLowStock({ limit: 100 }),
    staleTime: 30_000,
  });

  const parts = partsQuery.data?.data ?? [];
  const total = partsQuery.data?.meta.total ?? 0;
  const totalPages = partsQuery.data?.meta.totalPages ?? 1;
  const categories = categoriesQuery.data ?? [];
  const lowStockCount = lowStockQuery.data?.meta?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Low stock alert */}
      {lowStockCount > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{lowStockCount} repuesto{lowStockCount !== 1 ? "s" : ""}</span>{" "}
            con stock bajo o agotado
          </p>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto border-amber-300 text-amber-800 hover:bg-amber-100"
            onClick={() => {
              /* TODO: filter low stock */
            }}
          >
            Ver
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Repuestos</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            {categories.length > 0 ? (
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : null}
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar repuesto o referencia..."
              className="sm:max-w-xs"
            />
          </div>
        </CardHeader>

        <CardContent>
          {partsQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : null}

          {partsQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              No fue posible cargar el inventario.
            </div>
          ) : null}

          {!partsQuery.isPending && !partsQuery.isError && parts.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No hay repuestos para mostrar.
            </div>
          ) : null}

          {!partsQuery.isPending && !partsQuery.isError && parts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {total} repuesto{total !== 1 ? "s" : ""} &mdash; página {page} de {totalPages}
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
                      <TableHead>Repuesto</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead className="text-right">P. venta</TableHead>
                      <TableHead>Proveedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part) => {
                      const isOut = part.stock === 0;
                      const isLow = !isOut && part.stock <= part.minStock;
                      return (
                        <TableRow
                          key={part.id}
                          className={cn(
                            "hover:bg-muted/40",
                            isOut && "bg-red-50/40",
                          )}
                        >
                          <TableCell>
                            <p className="text-sm font-medium text-foreground">{part.name}</p>
                            {part.description ? (
                              <p className="text-xs text-muted-foreground">{part.description}</p>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {part.code ? (
                              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                                {part.code}
                              </code>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {part.category ? (
                              <Badge variant="secondary" className="text-xs">{part.category}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-semibold",
                                isOut && "border-red-200 bg-red-100 text-red-700",
                                isLow && "border-amber-200 bg-amber-100 text-amber-700",
                                !isOut && !isLow && "border-green-200 bg-green-100 text-green-700",
                              )}
                            >
                              {isOut ? "Agotado" : `${part.stock} uds`}
                            </Badge>
                            {part.minStock > 0 ? (
                              <p className="mt-0.5 text-xs text-muted-foreground">mín. {part.minStock}</p>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {part.location ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-foreground">
                            {part.salePrice != null
                              ? `${part.salePrice.toFixed(2)} €`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {part.supplier ?? "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
