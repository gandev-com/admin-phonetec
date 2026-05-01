import { ReportsTable } from "@/features/reports/components/reports-table";

export default function ReportsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Órdenes de reparación</h1>
        <p className="text-sm text-slate-600">Gestión de todas las órdenes del taller.</p>
      </div>

      <ReportsTable />
    </section>
  );
}
