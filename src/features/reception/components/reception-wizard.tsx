"use client";

import { ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CustomerSearchBar } from "./customer-search-bar";
import { NewCustomerQuickForm } from "./new-customer-quick-form";
import { DeviceStep } from "./wizard-steps/device-step";
import { OrderStep } from "./wizard-steps/order-step";
import { SignStep } from "./wizard-steps/sign-step";
import { SuccessStep } from "./wizard-steps/success-step";
import { StepCrumb } from "./wizard-steps/step-crumb";
import { useReceptionWizard } from "../hooks/use-reception-wizard";

export function ReceptionWizard() {
  const {
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
  } = useReceptionWizard();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <StepCrumb active={step === "search"} done={step !== "search"} label="Buscar cliente" />
        <ChevronRight className="h-3 w-3" />
        <StepCrumb
          active={
            step === "new-customer" || step === "select-device" || step === "new-device"
          }
          done={step === "create-order" || step === "sign-reception" || step === "success"}
          label="Dispositivo"
        />
        <ChevronRight className="h-3 w-3" />
        <StepCrumb
          active={step === "create-order"}
          done={step === "sign-reception" || step === "success"}
          label="Orden"
        />
        <ChevronRight className="h-3 w-3" />
        <StepCrumb active={step === "sign-reception"} done={step === "success"} label="Firma" />
      </nav>

      {/* Step: Search */}
      {step === "search" && (
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Buscar cliente</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            <CustomerSearchBar onSelect={handleCustomerSelected} onCreateNew={handleNewCustomer} />
          </CardContent>
        </Card>
      )}

      {/* Step: New Customer */}
      {step === "new-customer" && (
        <NewCustomerQuickForm
          initialName={searchTerm}
          onSuccess={handleCustomerCreated}
          onCancel={() => setStep("search")}
        />
      )}

      {/* Step: Select / New Device */}
      {(step === "select-device" || step === "new-device") && customer && (
        <DeviceStep
          customer={customer}
          subStep={step}
          onDeviceSelected={handleDeviceSelected}
          onAddNewDevice={() => setStep("new-device")}
          onChangeCustomer={() => setStep("search")}
          onBack={() => setStep("select-device")}
        />
      )}

      {/* Step: Create Order */}
      {step === "create-order" && customer && selectedDevice && (
        <OrderStep
          customer={customer}
          device={selectedDevice}
          onSubmit={handleOrderReady}
          onBack={() => setStep("select-device")}
        />
      )}

      {/* Step: Sign Reception */}
      {step === "sign-reception" && customer && selectedDevice && pendingOrderData && (
        <SignStep
          customer={customer}
          device={selectedDevice}
          pendingOrderData={pendingOrderData}
          isCreating={createOrderMutation.isPending}
          isSigning={signReceptionMutation.isPending}
          hasCreateError={createOrderMutation.isError}
          hasSignError={signReceptionMutation.isError}
          onSignAndCreate={handleSignAndCreate}
          onBack={() => setStep("create-order")}
        />
      )}

      {/* Step: Success */}
      {step === "success" && createdReport && customer && selectedDevice && pendingOrderData && (
        <SuccessStep
          customer={customer}
          device={selectedDevice}
          report={createdReport}
          pendingOrderData={pendingOrderData}
          signatureDataUrl={signatureDataUrl}
          signedBy={receptionSignedBy}
          onReset={reset}
        />
      )}
    </div>
  );
}
