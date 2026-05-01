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

const schema = z.object({
  documentType: z.enum(["DNI", "NIE", "PASAPORTE", "CIF"] as const),
  document: z.string().min(1, "Obligatorio"),
  firstName: z.string().min(1, "Obligatorio"),
  lastName: z.string().min(1, "Obligatorio"),
  secondLastName: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone1: z.string().min(1, "Obligatorio"),
  phone2: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
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
    mutationFn: (data: FormValues) => customersApi.create(data as CreateCustomerDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente creado correctamente");
      onClose();
    },
    onError: () => {
      toast.error("Error al crear el cliente");
    },
  });

  function onSubmit(data: FormValues) {
    mutation.mutate(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Nuevo cliente</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Document type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Tipo documento</label>
              <select
                {...register("documentType")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
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
              <label className="text-xs font-medium text-slate-600">Nº documento *</label>
              <Input {...register("document")} placeholder="12345678A" />
              {errors.document ? <p className="text-xs text-red-500">{errors.document.message}</p> : null}
            </div>

            {/* First name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Nombre *</label>
              <Input {...register("firstName")} placeholder="Juan" />
              {errors.firstName ? <p className="text-xs text-red-500">{errors.firstName.message}</p> : null}
            </div>

            {/* Last name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Primer apellido *</label>
              <Input {...register("lastName")} placeholder="García" />
              {errors.lastName ? <p className="text-xs text-red-500">{errors.lastName.message}</p> : null}
            </div>

            {/* Second last name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Segundo apellido</label>
              <Input {...register("secondLastName")} placeholder="López" />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Email</label>
              <Input {...register("email")} type="email" placeholder="juan@example.com" />
              {errors.email ? <p className="text-xs text-red-500">{errors.email.message}</p> : null}
            </div>

            {/* Phone 1 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Teléfono 1 *</label>
              <Input {...register("phone1")} placeholder="612345678" />
              {errors.phone1 ? <p className="text-xs text-red-500">{errors.phone1.message}</p> : null}
            </div>

            {/* Phone 2 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Teléfono 2</label>
              <Input {...register("phone2")} placeholder="912345678" />
            </div>

            {/* Address */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">Dirección</label>
              <Input {...register("address")} placeholder="Calle Mayor 1, 2ºA" />
            </div>

            {/* Postal code */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Código postal</label>
              <Input {...register("postalCode")} placeholder="28001" />
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Ciudad</label>
              <Input {...register("city")} placeholder="Madrid" />
            </div>

            {/* Province */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Provincia</label>
              <Input {...register("province")} placeholder="Madrid" />
            </div>

            {/* Data consent */}
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                id="dataConsent"
                {...register("dataConsent")}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="dataConsent" className="text-sm text-slate-700">
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
