import { CustomersTable } from "@/features/customers/components/customers-table";

export default function CustomersPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-600">Listado real conectado al endpoint de customers.</p>
      </div>

      <CustomersTable />
    </section>
  );
}
