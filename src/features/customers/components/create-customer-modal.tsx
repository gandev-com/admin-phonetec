"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customersApi } from "@/lib/api/customers";
import type { CreateCustomerDto } from "@/types/customer";

const PHONE_REGEX = /^(\+34)?[6-9]\d{8}$/;

const schema = z.object({
  documentType: z.enum(["DNI", "NIE", "PASAPORTE", "CIF"] as const),
  document: z.string().min(1, "Obligatorio"),
  firstName: z.string().min(1, "Obligatorio"),
  lastName: z.string().min(1, "Obligatorio"),
  secondLastName: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone1: z.string().regex(PHONE_REGEX, "Formato inválido (ej: 612345678 o +34612345678)"),
  phone2: z.string().regex(PHONE_REGEX, "Formato inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  postalCode: z.string().regex(/^\d{5}$/, "Debe tener 5 dígitos").optional().or(z.literal("")),
  city: z.string().optional(),
  province: z.string().optional(),
  dataConsent: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface CreateCustomerModalProps {
  onClose: () => void;
}

export function CreateCustomerModal({ onClose }: CreateCustomerModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: "DNI",
      dataConsent: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      // Strip empty strings so the backend doesn't receive "" for optional fields
      const payload: CreateCustomerDto = {
        ...data,
        email: data.email?.trim() || undefined,
        phone2: data.phone2?.trim() || undefined,
        secondLastName: data.secondLastName?.trim() || undefined,
        address: data.address?.trim() || undefined,
        postalCode: data.postalCode?.trim() || undefined,
        city: data.city?.trim() || undefined,
        province: data.province?.trim() || undefined,
      };
      return customersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente creado correctamente");
      onClose();
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      const detail = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(detail ? `Error: ${detail}` : "Error al crear el cliente");
    },
  });

  function onSubmit(data: FormValues) {
    mutation.mutate(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Nuevo cliente</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Document type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Tipo documento</label>
              <select
                {...register("documentType")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              >
                <option value="DNI">DNI</option>
                <option value="NIE">NIE</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="CIF">CIF</option>
              </select>
              {errors.documentType ? <p className="text-xs text-red-500">{errors.documentType.message}</p> : null}
            </div>

            {/* Document number */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Nº documento *</label>
              <Input {...register("document")} placeholder="12345678A" />
              {errors.document ? <p className="text-xs text-red-500">{errors.document.message}</p> : null}
            </div>

            {/* First name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Nombre *</label>
              <Input {...register("firstName")} placeholder="Juan" />
              {errors.firstName ? <p className="text-xs text-red-500">{errors.firstName.message}</p> : null}
            </div>

            {/* Last name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Primer apellido *</label>
              <Input {...register("lastName")} placeholder="García" />
              {errors.lastName ? <p className="text-xs text-red-500">{errors.lastName.message}</p> : null}
            </div>

            {/* Second last name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Segundo apellido</label>
              <Input {...register("secondLastName")} placeholder="López" />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Email</label>
              <Input {...register("email")} type="email" placeholder="juan@example.com" />
              {errors.email ? <p className="text-xs text-red-500">{errors.email.message}</p> : null}
            </div>

            {/* Phone 1 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Teléfono 1 *</label>
              <Input {...register("phone1")} placeholder="612345678" />
              {errors.phone1 ? <p className="text-xs text-red-500">{errors.phone1.message}</p> : null}
            </div>

            {/* Phone 2 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Teléfono 2</label>
              <Input {...register("phone2")} placeholder="912345678" />
            </div>

            {/* Address */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-foreground">Dirección</label>
              <Input {...register("address")} placeholder="Calle Mayor 1, 2ºA" />
            </div>

            {/* Postal code */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Código postal</label>
              <Input {...register("postalCode")} placeholder="28001" />
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Ciudad</label>
              <Input {...register("city")} placeholder="Madrid" />
            </div>

            {/* Province */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Provincia</label>
              <Input {...register("province")} placeholder="Madrid" />
            </div>

            {/* Data consent */}
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                id="dataConsent"
                {...register("dataConsent")}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="dataConsent" className="text-sm text-foreground">
                El cliente ha aceptado el tratamiento de datos (RGPD)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Crear cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
