import { UsersTable } from "@/features/users/components/users-table";

export default function UsersPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">Listado real desde el backend de PhoneTec.</p>
      </div>

      <UsersTable />
    </section>
  );
}
