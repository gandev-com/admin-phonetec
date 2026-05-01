import { DashboardStats, DashboardStatusBreakdown } from "@/features/reports/components/dashboard-stats";
import { RecentReports } from "@/features/reports/components/recent-reports";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Resumen de órdenes y actividad del taller.</p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Órdenes por estado</h2>
          <DashboardStatusBreakdown />
        </div>
        <RecentReports />
      </div>
    </section>
  );
}
