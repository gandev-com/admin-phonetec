import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { reportsApi } from "@/lib/api/reports";
import type { Customer } from "@/types/customer";
import type { Device } from "@/types/device";
import type { Report } from "@/types/report";
import type { OrderFormValues } from "@/lib/schemas/reception";

export type WizardStep =
  | "search"
  | "new-customer"
  | "select-device"
  | "new-device"
  | "create-order"
  | "sign-reception"
  | "success";

export function useReceptionWizard() {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>("search");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [createdReport, setCreatedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingOrderData, setPendingOrderData] = useState<OrderFormValues | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [receptionSignedBy, setReceptionSignedBy] = useState("");

  const createOrderMutation = useMutation({
    mutationFn: (data: OrderFormValues) =>
      reportsApi.create({
        ...data,
        customerId: String(customer!.id),
        deviceId: String(selectedDevice!.id),
        estimatedDeliveryDate: data.estimatedDeliveryDate || undefined,
      }),
  });

  const signReceptionMutation = useMutation({
    mutationFn: ({
      reportId,
      file,
      signedBy,
    }: {
      reportId: number | string;
      file: File;
      signedBy: string;
    }) => reportsApi.signReception(reportId, file, signedBy),
  });

  function handleCustomerSelected(c: Customer) {
    setCustomer(c);
    setSelectedDevice(null);
    setStep("select-device");
  }

  function handleNewCustomer(term: string) {
    setSearchTerm(term);
    setStep("new-customer");
  }

  function handleCustomerCreated(c: Customer) {
    setCustomer(c);
    setSelectedDevice(null);
    setStep("select-device");
  }

  function handleDeviceSelected(device: Device) {
    setSelectedDevice(device);
    setStep("create-order");
  }

  function handleOrderReady(data: OrderFormValues) {
    setPendingOrderData(data);
    setStep("sign-reception");
  }

  async function handleSignAndCreate(file: File, dataUrl: string, signedBy: string) {
    if (!pendingOrderData || !customer || !selectedDevice) return;

    setSignatureDataUrl(dataUrl);
    setReceptionSignedBy(signedBy);

    try {
      const report = await createOrderMutation.mutateAsync(pendingOrderData);
      setCreatedReport(report);
      await signReceptionMutation.mutateAsync({ reportId: report.id, file, signedBy });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(`Orden ${report.orderNumber} creada y firmada correctamente`);
      setStep("success");
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response
        ?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(detail ? `Error: ${detail}` : "No se pudo completar la recepción");
    }
  }

  function reset() {
    setStep("search");
    setCustomer(null);
    setSelectedDevice(null);
    setCreatedReport(null);
    setSearchTerm("");
    setReceptionSignedBy("");
    setPendingOrderData(null);
    setSignatureDataUrl(null);
  }

  return {
    step,
    setStep,
    customer,
    selectedDevice,
    createdReport,
    searchTerm,
    pendingOrderData,
    signatureDataUrl,
    receptionSignedBy,
    createOrderMutation,
    signReceptionMutation,
    handleCustomerSelected,
    handleNewCustomer,
    handleCustomerCreated,
    handleDeviceSelected,
    handleOrderReady,
    handleSignAndCreate,
    reset,
  };
}
