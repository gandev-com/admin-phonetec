"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";

import { BackButton } from "@/components/shared/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { customersApi } from "@/lib/api/customers";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = use(params);

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customers", id],
    queryFn: () => customersApi.getOne(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!customer) {
    return <p className="text-destructive">Cliente no encontrado.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <BackButton fallback={`/customers/${id}`} />
        <div>
          <h1 className="text-2xl font-bold">Editar cliente</h1>
          <p className="text-sm text-muted-foreground">
            {customer.firstName} {customer.lastName}
            {customer.secondLastName ? ` ${customer.secondLastName}` : ""}
          </p>
        </div>
      </div>

      <CustomerForm customer={customer} />
    </div>
  );
}
