import { PartsTable } from "@/features/parts/components/parts-table";

export default function PartsPage() {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inventario</h1>
        <p className="text-sm text-muted-foreground">Control de repuestos y stock del taller.</p>
      </div>

      <PartsTable />
    </section>
  );
}
