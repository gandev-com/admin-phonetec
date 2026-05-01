import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CustomerDetail } from "@/features/customers/components/customer-detail";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Detalle del cliente</h1>
      </div>

      <CustomerDetail id={id} />
    </section>
  );
}
