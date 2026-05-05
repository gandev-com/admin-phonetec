import { DeliveryQueue } from "@/features/delivery/components/delivery-queue";

export default function DeliveryPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Entregas</h1>
        <p className="text-sm text-muted-foreground">
          Órdenes listas para entregar. Confirma la entrega con firma del cliente.
        </p>
      </div>

      <DeliveryQueue />
    </section>
  );
}
