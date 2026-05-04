import { DevicesTable } from "@/features/devices/components/devices-table";

export default function DevicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dispositivos</h1>
        <p className="text-muted-foreground">Gestión de dispositivos registrados</p>
      </div>
      <DevicesTable />
    </div>
  );
}
