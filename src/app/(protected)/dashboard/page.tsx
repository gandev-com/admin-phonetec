import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Panel base listo para crecer por modulos de negocio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">Activos</p>
            <p className="text-sm text-slate-500">Gestion desde modulo Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">Registrados</p>
            <p className="text-sm text-slate-500">Gestion desde modulo Customers</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
