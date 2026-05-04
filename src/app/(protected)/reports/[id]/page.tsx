import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ReportDetail } from "@/features/reports/components/report-detail";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Detalle de orden</h1>
      </div>

      <ReportDetail id={id} />
    </section>
  );
}
