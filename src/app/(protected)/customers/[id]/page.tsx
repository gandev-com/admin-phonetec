import { BackButton } from "@/components/shared/back-button";
import { CustomerDetail } from "@/features/customers/components/customer-detail";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton fallback="/customers" />
        <h1 className="text-2xl font-semibold text-foreground">Detalle del cliente</h1>
      </div>

      <CustomerDetail id={id} />
    </section>
  );
}
