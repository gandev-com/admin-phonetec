"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { customersApi } from "@/lib/api/customers";
import type { Customer, UpdateCustomerDto } from "@/types/customer";

// ─── Schema ───────────────────────────────────────────────────────────────────

const PHONE_REGEX = /^(\+34)?[6-9]\d{8}$/;

const schema = z.object({
  documentType: z.enum(["DNI", "NIE", "PASAPORTE", "CIF"] as const),
  document: z.string().min(1, "Obligatorio"),
  firstName: z.string().min(1, "Obligatorio"),
  lastName: z.string().min(1, "Obligatorio"),
  secondLastName: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone1: z.string().regex(PHONE_REGEX, "Formato inválido (ej: 612345678 o +34612345678)"),
  phone2: z
    .string()
    .regex(PHONE_REGEX, "Formato inválido")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Debe tener 5 dígitos")
    .optional()
    .or(z.literal("")),
  city: z.string().optional(),
  province: z.string().optional(),
  dataConsent: z.boolean(),
  internalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface CustomerFormProps {
  customer: Customer;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: customer.documentType,
      document: customer.document,
      firstName: customer.firstName,
      lastName: customer.lastName,
      secondLastName: customer.secondLastName ?? "",
      email: customer.email ?? "",
      phone1: customer.phone1,
      phone2: customer.phone2 ?? "",
      address: customer.address ?? "",
      postalCode: customer.postalCode ?? "",
      city: customer.city ?? "",
      province: customer.province ?? "",
      dataConsent: customer.dataConsent,
      internalNotes: customer.internalNotes ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload: UpdateCustomerDto = {
        ...data,
        secondLastName: data.secondLastName?.trim() || undefined,
        email: data.email?.trim() || undefined,
        phone2: data.phone2?.trim() || undefined,
        address: data.address?.trim() || undefined,
        postalCode: data.postalCode?.trim() || undefined,
        city: data.city?.trim() || undefined,
        province: data.province?.trim() || undefined,
        internalNotes: data.internalNotes?.trim() || undefined,
      };
      return customersApi.update(customer.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", String(customer.id)] });
      toast.success("Cliente actualizado correctamente");
      router.push(`/customers/${customer.id}`);
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      const detail = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(detail ? `Error: ${detail}` : "Error al actualizar el cliente");
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
      {/* ── Identificación ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Identificación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Tipo documento</Label>
            <select
              {...register("documentType")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            >
              <option value="DNI">DNI</option>
              <option value="NIE">NIE</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="CIF">CIF</option>
            </select>
            {errors.documentType && (
              <p className="text-xs text-destructive">{errors.documentType.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Nº documento *</Label>
            <Input {...register("document")} placeholder="12345678A" />
            {errors.document && (
              <p className="text-xs text-destructive">{errors.document.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Nombre *</Label>
            <Input {...register("firstName")} placeholder="Juan" />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Primer apellido *</Label>
            <Input {...register("lastName")} placeholder="García" />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Segundo apellido</Label>
            <Input {...register("secondLastName")} placeholder="López" />
          </div>
        </CardContent>
      </Card>

      {/* ── Contacto ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input {...register("email")} type="email" placeholder="juan@example.com" />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Teléfono 1 *</Label>
            <Input {...register("phone1")} placeholder="612345678" />
            {errors.phone1 && (
              <p className="text-xs text-destructive">{errors.phone1.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Teléfono 2</Label>
            <Input {...register("phone2")} placeholder="912345678" />
            {errors.phone2 && (
              <p className="text-xs text-destructive">{errors.phone2.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Dirección ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Dirección</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Dirección</Label>
            <Input {...register("address")} placeholder="Calle Mayor 1, 2ºA" />
          </div>

          <div className="space-y-1">
            <Label>Código postal</Label>
            <Input {...register("postalCode")} placeholder="28001" />
            {errors.postalCode && (
              <p className="text-xs text-destructive">{errors.postalCode.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Ciudad</Label>
            <Input {...register("city")} placeholder="Madrid" />
          </div>

          <div className="space-y-1">
            <Label>Provincia</Label>
            <Input {...register("province")} placeholder="Madrid" />
          </div>
        </CardContent>
      </Card>

      {/* ── Otros ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Otros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dataConsent"
              {...register("dataConsent")}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="dataConsent" className="cursor-pointer font-normal">
              El cliente ha aceptado el tratamiento de datos (RGPD)
            </Label>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label>Notas internas</Label>
            <textarea
              {...register("internalNotes")}
              rows={3}
              placeholder="Notas visibles solo para el equipo..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/customers/${customer.id}`)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
