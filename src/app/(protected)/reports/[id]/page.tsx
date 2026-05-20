import { BackButton } from "@/components/shared/back-button";
import { ReportDetail } from "@/features/reports/components/report-detail";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton fallback="/reports" />
        <h1 className="text-2xl font-semibold text-foreground">Detalle de orden</h1>
      </div>

      <ReportDetail id={id} />
    </section>
  );
}
