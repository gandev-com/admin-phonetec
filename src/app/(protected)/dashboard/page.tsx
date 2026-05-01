import { DashboardStats, DashboardStatusBreakdown } from "@/features/reports/components/dashboard-stats";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Resumen de órdenes y actividad del taller.</p>
      </div>

      <DashboardStats />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Órdenes por estado</h2>
        <DashboardStatusBreakdown />
      </div>
    </section>
  );
}
