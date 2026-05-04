"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { settingsApi } from "@/lib/api/settings";
import type { Setting } from "@/types/setting";

export default function SettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.list(),
  });

  const settings = settingsQuery.data ?? [];

  // Group by category
  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    const cat = s.category ?? "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">Parámetros del sistema. Solo los campos editables pueden modificarse.</p>
      </div>

      {settingsQuery.isPending ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : settingsQuery.isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No fue posible cargar la configuración del sistema.
        </p>
      ) : settings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No hay parámetros configurados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category.toLowerCase()}</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border px-6 pb-0">
                {items.map((setting) => (
                  <SettingRow key={setting.key} setting={setting} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingRow({ setting }: { setting: Setting }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(setting.value ?? "");

  const mutation = useMutation({
    mutationFn: (value: string) => settingsApi.update(setting.key, { value }),
    onSuccess: (updated) => {
      queryClient.setQueryData<Setting[]>(["settings"], (prev) =>
        prev?.map((s) => (s.key === updated.key ? updated : s)),
      );
      toast.success(`"${setting.label ?? setting.key}" actualizado`);
      setEditing(false);
    },
    onError: () => toast.error("No se pudo guardar el ajuste"),
  });

  function handleSave() {
    mutation.mutate(draft);
  }

  function handleCancel() {
    setDraft(setting.value ?? "");
    setEditing(false);
  }

  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-2 last:pb-4">
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium text-foreground">{setting.label ?? setting.key}</p>
        <p className="font-mono text-xs text-muted-foreground/70">{setting.key}</p>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
        {editing ? (
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
            <Button size="icon-sm" onClick={handleSave} disabled={mutation.isPending} title="Guardar">
              <Check />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={handleCancel} title="Cancelar">
              <X />
            </Button>
          </div>
        ) : (
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {setting.value ?? <span className="italic opacity-50">sin valor</span>}
          </p>
        )}
      </div>

      {setting.isEditable && !editing && (
        <Button
          variant="ghost"
          size="icon-sm"
          title="Editar"
          onClick={() => {
            setDraft(setting.value ?? "");
            setEditing(true);
          }}
        >
          <Pencil />
        </Button>
      )}

      {!setting.isEditable && (
        <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Solo lectura
        </span>
      )}
    </div>
  );
}
