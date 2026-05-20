import React from "react";
import type { Report } from "@/types/report";

// ─── Display maps (duplicated to keep this component self-contained) ──────────

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Recibido",
  IN_DIAGNOSIS: "Diagnóstico",
  BUDGET_SENT: "Presupuesto enviado",
  BUDGET_ACCEPTED: "Pres. aceptado",
  BUDGET_REJECTED: "Pres. rechazado",
  WAITING_PARTS: "Esp. repuesto",
  IN_REPAIR: "En reparación",
  REPAIRED: "Reparado",
  TESTING: "En pruebas",
  READY_FOR_PICKUP: "Listo para recoger",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  IRREPARABLE: "No reparable",
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  REFUNDED: "Reembolsado",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  REPAIR_ORDER: "Orden de Reparación",
  BUDGET: "Presupuesto",
  REVISION: "Revisión",
  WARRANTY: "Garantía",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const WARRANTY_LABELS: Record<string, string> = {
  NO_WARRANTY: "Sin garantía",
  WARRANTY_3_MONTHS: "3 meses",
  WARRANTY_6_MONTHS: "6 meses",
  WARRANTY_12_MONTHS: "12 meses",
  WARRANTY_24_MONTHS: "24 meses",
  MANUFACTURER_WARRANTY: "Garantía fabricante",
};

const EXIT_CONDITION_LABELS: Record<string, string> = {
  REPAIRED: "Reparado",
  PARTIALLY_REPAIRED: "Parcialmente reparado",
  NOT_REPAIRED: "No reparado",
  CLIENT_NOT_AUTHORIZED: "Cliente no autoriza",
  IRREPARABLE: "Irreparable",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { dateStyle: "medium" });
}

function fileUrl(raw: string): string {
  const relative = raw.replace(/^https?:\/\/[^/]+/, "");
  return relative.startsWith("/") ? relative : `/${relative}`;
}

// ─── Print sub-components ─────────────────────────────────────────────────────

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "7pt", breakInside: "avoid" }}>
      <div
        style={{
          borderBottom: "1pt solid #2563eb",
          paddingBottom: "2pt",
          marginBottom: "4pt",
          display: "flex",
          alignItems: "center",
          gap: "4pt",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "3pt",
            height: "8pt",
            backgroundColor: "#2563eb",
            borderRadius: "2pt",
          }}
        />
        <span style={{ fontSize: "6.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6pt", color: "#475569" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function PrintField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: "2pt" }}>
      <span style={{ fontSize: "6.5pt", color: "#64748b", display: "block" }}>{label}</span>
      <span style={{ fontSize: "8pt", color: "#0f172a" }}>{value || "—"}</span>
    </div>
  );
}

function PrintGrid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "3pt 12pt",
      }}
    >
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ReportPrintViewProps {
  report: Report;
}

export const ReportPrintView = React.forwardRef<HTMLDivElement, ReportPrintViewProps>(
  function ReportPrintView({ report }, ref) {
    const customer = report.customer;
    const device = report.device;
    const technician = report.technician;

    const subtotal = (report.laborCost ?? 0) + (report.partsCost ?? 0);
    const discount = report.discount ?? 0;
    const total = (report.total ?? report.finalBudget ?? (subtotal - discount)) || null;

    const allConsents = [
      ...(report.consentDocuments ?? []),
      ...(report.consentDocument &&
      !(report.consentDocuments ?? []).find((d) => d.id === report.consentDocument!.id)
        ? [{ ...report.consentDocument, type: "DELIVERY" as const }]
        : []),
    ];

    return (
      <div
        ref={ref}
        className="print-doc-root"
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: "#0f172a",
          backgroundColor: "#fff",
          padding: "0",
          margin: "0",
          fontSize: "8pt",
          lineHeight: "1.3",
        }}
      >
        {/* ── Letterhead ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2pt solid #2563eb",
            paddingBottom: "6pt",
            marginBottom: "8pt",
          }}
        >
          <div>
            <div style={{ fontSize: "14pt", fontWeight: 800, color: "#2563eb", letterSpacing: "-0.5pt" }}>
              PhoneTec
            </div>
            <div style={{ fontSize: "7pt", color: "#64748b", marginTop: "1pt" }}>
              Servicio técnico de telefonía
            </div>
            <div style={{ fontSize: "7pt", color: "#64748b" }}>info@phonetec.com</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "6.5pt", textTransform: "uppercase", letterSpacing: "0.6pt", color: "#94a3b8", marginBottom: "1pt" }}>
              {ORDER_TYPE_LABELS[report.reportType] ?? report.reportType}
            </div>
            <div style={{ fontSize: "13pt", fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
              {report.orderNumber}
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: "3pt",
                padding: "1pt 6pt",
                borderRadius: "8pt",
                fontSize: "7pt",
                fontWeight: 600,
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "0.5pt solid #e2e8f0",
              }}
            >
              {STATUS_LABELS[report.currentStatus] ?? report.currentStatus}
            </div>
            {report.isUrgent && (
              <div
                style={{
                  display: "inline-block",
                  marginLeft: "3pt",
                  marginTop: "3pt",
                  padding: "1pt 6pt",
                  borderRadius: "8pt",
                  fontSize: "7pt",
                  fontWeight: 700,
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                  border: "0.5pt solid #fecaca",
                }}
              >
                ⚑ URGENTE
              </div>
            )}
          </div>
        </div>

        {/* ── Meta strip ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "4pt",
            backgroundColor: "#f8fafc",
            border: "0.5pt solid #e2e8f0",
            borderRadius: "4pt",
            padding: "4pt 10pt",
            marginBottom: "8pt",
            fontSize: "7.5pt",
          }}
        >
          {[
            { label: "Recepción", value: fmtDate(report.receptionDate || report.createdAt) },
            { label: "Entrega estimada", value: fmtDate(report.estimatedDeliveryDate) },
            { label: "Prioridad", value: PRIORITY_LABELS[report.priority] ?? report.priority },
            { label: "Pago", value: PAYMENT_LABELS[report.paymentStatus] ?? report.paymentStatus },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ color: "#94a3b8", marginBottom: "1pt" }}>{label}</div>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── Customer + Device ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10pt", marginBottom: "8pt" }}>
          {/* Customer */}
          <PrintSection title="Cliente">
            {customer ? (
              <PrintGrid cols={2}>
                <PrintField
                  label="Nombre completo"
                  value={`${customer.firstName} ${customer.lastName}${customer.secondLastName ? ` ${customer.secondLastName}` : ""}`}
                />
                <PrintField label="Documento" value={`${customer.documentType} ${customer.document}`} />
                <PrintField label="Teléfono" value={customer.phone1} />
                <PrintField label="Email" value={customer.email} />
                {(customer.city || customer.province) && (
                  <PrintField
                    label="Ciudad / Provincia"
                    value={[customer.city, customer.province].filter(Boolean).join(", ")}
                  />
                )}
              </PrintGrid>
            ) : (
              <PrintField label="ID" value={String(report.customerId)} />
            )}
          </PrintSection>

          {/* Device */}
          <PrintSection title="Dispositivo">
            {device ? (
              <PrintGrid cols={2}>
                <PrintField
                  label="Marca / Modelo"
                  value={`${device.brand?.name ?? ""} ${device.model ?? ""}`.trim() || "—"}
                />
                <PrintField label="IMEI entrada" value={device.imeiIn} />
                {device.imeiOut && <PrintField label="IMEI salida" value={device.imeiOut} />}
                {device.serialNumber && <PrintField label="Nº Serie" value={device.serialNumber} />}
                {device.screenCondition && <PrintField label="Estado pantalla" value={device.screenCondition} />}
                {device.caseCondition && <PrintField label="Estado carcasa" value={device.caseCondition} />}
              </PrintGrid>
            ) : (
              <PrintField label="ID" value={String(report.deviceId)} />
            )}
          </PrintSection>
        </div>

        {/* ── Diagnosis & repair ───────────────────────────────────────────── */}
        <PrintSection title="Diagnóstico y reparación">
          <PrintGrid cols={1}>
            {report.reportedIssue && <PrintField label="Problema reportado" value={report.reportedIssue} />}
            {report.technicalDiagnosis && <PrintField label="Diagnóstico técnico" value={report.technicalDiagnosis} />}
            {report.repairPerformed && <PrintField label="Reparación realizada" value={report.repairPerformed} />}
          </PrintGrid>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3pt 12pt", marginTop: "3pt" }}>
            {report.entryCondition && <PrintField label="Estado de entrada" value={report.entryCondition} />}
            {report.exitCondition && (
              <PrintField label="Estado de salida" value={EXIT_CONDITION_LABELS[report.exitCondition] ?? report.exitCondition} />
            )}
            {technician && (
              <PrintField label="Técnico asignado" value={`${technician.firstName} ${technician.lastName}`} />
            )}
          </div>
        </PrintSection>

        {/* ── Costs ────────────────────────────────────────────────────────── */}
        <PrintSection title="Costes y facturación">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {["Concepto", "Importe"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Importe" ? "right" : "left",
                      padding: "3pt 6pt",
                      fontWeight: 700,
                      fontSize: "6.5pt",
                      textTransform: "uppercase",
                      letterSpacing: "0.4pt",
                      color: "#64748b",
                      borderBottom: "1pt solid #e2e8f0",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Presupuesto inicial", value: report.initialBudget },
                { label: "Mano de obra", value: report.laborCost },
                { label: "Piezas / repuestos", value: report.partsCost },
                { label: "Descuento", value: report.discount ? -(report.discount) : null },
              ]
                .filter(({ value }) => value != null)
                .map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: "0.5pt solid #f1f5f9" }}>
                    <td style={{ padding: "2pt 6pt", color: "#334155" }}>{label}</td>
                    <td style={{ padding: "2pt 6pt", textAlign: "right", color: "#334155" }}>
                      {value !== null && value !== undefined
                        ? Math.abs(value).toLocaleString("es-ES", { style: "currency", currency: "EUR" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              <tr
                style={{
                  backgroundColor: "#eff6ff",
                  borderTop: "1.5pt solid #2563eb",
                }}
              >
                <td style={{ padding: "3pt 6pt", fontWeight: 700, color: "#1e293b" }}>TOTAL</td>
                <td style={{ padding: "3pt 6pt", textAlign: "right", fontWeight: 800, fontSize: "9pt", color: "#2563eb" }}>
                  {fmt(total)}
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: "4pt", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3pt 12pt" }}>
            <PrintField label="Estado de pago" value={PAYMENT_LABELS[report.paymentStatus]} />
            <PrintField label="Método de pago" value={report.paymentMethod} />
            {report.deliveryDate && <PrintField label="Fecha de entrega" value={fmtDate(report.deliveryDate)} />}
          </div>
        </PrintSection>

        {/* ── Parts ────────────────────────────────────────────────────────── */}
        {report.parts && report.parts.length > 0 && (
          <PrintSection title="Repuestos utilizados">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["Repuesto", "Cant.", "P. unit.", "Total"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Repuesto" ? "left" : "right",
                        padding: "3pt 6pt",
                        fontWeight: 700,
                        fontSize: "6.5pt",
                        textTransform: "uppercase",
                        letterSpacing: "0.4pt",
                        color: "#64748b",
                        borderBottom: "1pt solid #e2e8f0",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.parts.map((p) => (
                  <tr key={String(p.id)} style={{ borderBottom: "0.5pt solid #f1f5f9" }}>
                    <td style={{ padding: "2pt 6pt", color: "#334155" }}>{p.name}</td>
                    <td style={{ padding: "2pt 6pt", textAlign: "right", color: "#334155" }}>{p.quantity}</td>
                    <td style={{ padding: "2pt 6pt", textAlign: "right", color: "#334155" }}>{fmt(p.unitPrice)}</td>
                    <td style={{ padding: "2pt 6pt", textAlign: "right", fontWeight: 600, color: "#1e293b" }}>
                      {fmt(p.quantity * p.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintSection>
        )}

        {/* ── Warranty ─────────────────────────────────────────────────────── */}
        {report.warrantyType && report.warrantyType !== "NO_WARRANTY" && (
          <PrintSection title="Garantía">
            <PrintGrid cols={3}>
              <PrintField label="Tipo" value={WARRANTY_LABELS[report.warrantyType] ?? report.warrantyType} />
              <PrintField label="Días" value={report.warrantyDays != null ? `${report.warrantyDays} días` : undefined} />
              <PrintField label="Vence" value={fmtDate(report.warrantyEndDate)} />
            </PrintGrid>
          </PrintSection>
        )}

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        {report.customerNotes && (
          <PrintSection title="Notas para el cliente">
            <p style={{ fontSize: "9pt", color: "#334155", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
              {report.customerNotes}
            </p>
          </PrintSection>
        )}

        {/* ── Signatures ───────────────────────────────────────────────────── */}
        {allConsents.length > 0 && (
          <PrintSection title="Documentos firmados">
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(allConsents.length, 2)}, 1fr)`, gap: "8pt" }}>
              {allConsents.map((doc) => {
                const url = fileUrl(doc.fileUrl ?? doc.filePath);
                const isImage = /\.(png|jpe?g|webp)$/i.test(doc.filePath) || /\.(png|jpe?g|webp)$/i.test(doc.fileUrl ?? "");
                const label = doc.type === "RECEPTION" ? "Firma de recepción" : "Firma de entrega";
                return (
                  <div key={doc.id} style={{ border: "0.5pt solid #e2e8f0", borderRadius: "4pt", padding: "5pt" }}>
                    <div style={{ fontSize: "7pt", fontWeight: 700, color: "#475569", marginBottom: "3pt" }}>{label}</div>
                    {isImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={label} style={{ height: "36pt", maxWidth: "100%", objectFit: "contain" }} />
                    )}
                    <div style={{ marginTop: "3pt", fontSize: "7pt", color: "#64748b" }}>
                      Firmado por:{" "}
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{doc.signedBy}</span>
                      {" · "}
                      {new Date(doc.signedAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </PrintSection>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div
          style={{
            borderTop: "0.5pt solid #e2e8f0",
            marginTop: "8pt",
            paddingTop: "4pt",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "7pt",
            color: "#94a3b8",
          }}
        >
          <span>PhoneTec — Servicio técnico de telefonía</span>
          <span>Orden {report.orderNumber} · Impreso el {new Date().toLocaleDateString("es-ES", { dateStyle: "medium" })}</span>
        </div>
      </div>
    );
  },
);
