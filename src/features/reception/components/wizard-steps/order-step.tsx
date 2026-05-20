"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  orderSchema,
  type OrderFormValues,
  ORDER_TYPE_LABELS,
  PRIORITY_LABELS,
} from "@/lib/schemas/reception";
import type { Customer } from "@/types/customer";
import type { Device } from "@/types/device";

import { CustomerInfoCard } from "./customer-info-card";

interface OrderStepProps {
  customer: Customer;
  device: Device;
  onSubmit: (data: OrderFormValues) => void;
  onBack: () => void;
}

export function OrderStep({ customer, device, onSubmit, onBack }: OrderStepProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { reportType: "REPAIR_ORDER", priority: "NORMAL", isUrgent: false },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Nueva orden</CardTitle>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Cambiar dispositivo
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <CustomerInfoCard customer={customer} />

          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
            <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {device.brand?.name} {device.model}
              </p>
              {device.imeiIn && (
                <p className="text-xs text-muted-foreground">IMEI: {device.imeiIn}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo de orden *</Label>
                <Controller
                  control={control}
                  name="reportType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue>{ORDER_TYPE_LABELS[field.value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REPAIR_ORDER">Reparación</SelectItem>
                        <SelectItem value="BUDGET">Presupuesto</SelectItem>
                        <SelectItem value="REVISION">Revisión</SelectItem>
                        <SelectItem value="WARRANTY">Garantía</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label>Prioridad *</Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue>{PRIORITY_LABELS[field.value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baja</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                        <SelectItem value="URGENT">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="issue">Problema reportado *</Label>
              <Textarea
                id="issue"
                {...register("reportedIssue")}
                placeholder="Describe el problema del dispositivo…"
                rows={3}
              />
              {errors.reportedIssue && (
                <p className="text-xs text-destructive">{errors.reportedIssue.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="edd">Entrega estimada</Label>
              <Input
                id="edd"
                type="date"
                {...register("estimatedDeliveryDate")}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isUrgent"
                type="checkbox"
                {...register("isUrgent")}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isUrgent" className="cursor-pointer text-sm font-normal">
                Marcar como urgente
              </Label>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onBack}>
                Volver
              </Button>
              <Button type="submit" className="flex-1">
                Siguiente →
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
