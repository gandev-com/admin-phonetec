"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customersApi } from "@/lib/api/customers";
import type { CreateCustomerDto, Customer } from "@/types/customer";

const PHONE_REGEX = /^(\+34)?[6-9]\d{8}$/;

const schema = z.object({
  documentType: z.enum(["DNI", "NIE", "PASAPORTE", "CIF"] as const),
  document: z.string().min(1, "Obligatorio"),
  firstName: z.string().min(1, "Obligatorio"),
  lastName: z.string().min(1, "Obligatorio"),
  secondLastName: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone1: z.string().regex(PHONE_REGEX, "Formato: 612345678"),
  phone2: z.string().regex(PHONE_REGEX, "Formato: 612345678").optional().or(z.literal("")),
  city: z.string().optional(),
  dataConsent: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface NewCustomerQuickFormProps {
  initialName?: string;
  onSuccess: (customer: Customer) => void;
  onCancel: () => void;
}

export function NewCustomerQuickForm({ initialName = "", onSuccess, onCancel }: NewCustomerQuickFormProps) {
  const queryClient = useQueryClient();

  // Pre-fill first/last name from search term if possible
  const nameParts = initialName.trim().split(/\s+/);
  const defaultFirstName = nameParts[0] ?? "";
  const defaultLastName = nameParts.slice(1).join(" ");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: "DNI",
      firstName: defaultFirstName,
      lastName: defaultLastName,
      dataConsent: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload: CreateCustomerDto = {
        ...data,
        email: data.email?.trim() || undefined,
        phone2: data.phone2?.trim() || undefined,
        secondLastName: data.secondLastName?.trim() || undefined,
        city: data.city?.trim() || undefined,
      };
      return customersApi.create(payload);
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente creado correctamente");
      onSuccess(customer);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(detail ? `Error: ${detail}` : "Error al crear el cliente");
    },
  });

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Nuevo cliente</h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="nc-docType">Tipo doc.</Label>
            <select
              id="nc-docType"
              {...register("documentType")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            >
              {["DNI", "NIE", "PASAPORTE", "CIF"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-doc">Documento *</Label>
            <Input id="nc-doc" {...register("document")} placeholder="12345678A" />
            {errors.document && <p className="text-xs text-destructive">{errors.document.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="nc-firstName">Nombre *</Label>
            <Input id="nc-firstName" {...register("firstName")} placeholder="Juan" />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-lastName">Apellido *</Label>
            <Input id="nc-lastName" {...register("lastName")} placeholder="García" />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="nc-phone1">Teléfono *</Label>
            <Input id="nc-phone1" {...register("phone1")} placeholder="612345678" />
            {errors.phone1 && <p className="text-xs text-destructive">{errors.phone1.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-email">Email</Label>
            <Input id="nc-email" type="email" {...register("email")} placeholder="email@ejemplo.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="nc-city">Ciudad</Label>
          <Input id="nc-city" {...register("city")} placeholder="Madrid" />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="nc-consent"
            type="checkbox"
            {...register("dataConsent")}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="nc-consent" className="cursor-pointer text-sm font-normal">
            El cliente da consentimiento de datos
          </Label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando…" : "Crear cliente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
