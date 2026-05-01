import { UsersTable } from "@/features/users/components/users-table";

export default function UsersPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-600">Listado real desde el backend de PhoneTec.</p>
      </div>

      <UsersTable />
    </section>
  );
}
