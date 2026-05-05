"use client";

import { useState } from "react";
import Link from "next/link";

import { OrdersKanban } from "@/features/orders/components/orders-kanban";
import { DeliveryModal } from "@/features/delivery/components/delivery-modal";
import type { Report } from "@/types/report";

export default function OrdersPage() {
  const [deliveryReport, setDeliveryReport] = useState<Report | null>(null);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tablero de órdenes</h1>
          <p className="text-sm text-muted-foreground">Vista Kanban por estado de reparación.</p>
        </div>
        <Link
          href="/reports"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
        >
          Vista tabla
        </Link>
      </div>

      <OrdersKanban onDeliverClick={(r) => setDeliveryReport(r)} />

      {deliveryReport && (
        <DeliveryModal
          report={deliveryReport}
          onSuccess={() => setDeliveryReport(null)}
          onClose={() => setDeliveryReport(null)}
        />
      )}
    </section>
  );
}
