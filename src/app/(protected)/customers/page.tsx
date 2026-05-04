import { CustomersTable } from "@/features/customers/components/customers-table";

export default function CustomersPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground">Listado real conectado al endpoint de customers.</p>
      </div>

      <CustomersTable />
    </section>
  );
}
