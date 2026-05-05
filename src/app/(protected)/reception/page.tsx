import { ReceptionWizard } from "@/features/reception/components/reception-wizard";

export default function ReceptionPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Recepción</h1>
        <p className="text-sm text-muted-foreground">
          Busca o crea un cliente y registra una nueva orden de reparación.
        </p>
      </div>

      <ReceptionWizard />
    </section>
  );
}
