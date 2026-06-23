import type { Session } from "@/lib/types";
import type { Breakdown } from "@/lib/calc/settlement";
import type { ExportLabels } from "@/lib/export/excel";
import { formatIDR } from "@/lib/format";

export async function downloadPDF(
  session: Session,
  settlement: { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number },
  labels: ExportLabels
): Promise<void> {
  // Dynamic imports prevent SSR errors — pdfmake references browser globals at module init.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = ((await import("pdfmake/build/pdfmake")) as any).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = ((await import("pdfmake/build/vfs_fonts")) as any).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfMake as any).vfs = pdfFonts;

  const date = new Date().toLocaleDateString("id-ID");
  const pi = session.paymentInfo;

  const tableBody: unknown[][] = [
    [
      { text: labels.colName, bold: true, fillColor: "#f3f4f6" },
      { text: labels.colConsumption, bold: true, fillColor: "#f3f4f6" },
      { text: labels.colSharedShare, bold: true, fillColor: "#f3f4f6" },
      { text: labels.colTotal, bold: true, fillColor: "#f3f4f6" },
      { text: labels.colDeposit, bold: true, fillColor: "#f3f4f6" },
      { text: labels.colNetDue, bold: true, fillColor: "#f3f4f6" },
    ],
    ...settlement.breakdown.map((b) => [
      b.name,
      formatIDR(Math.round(b.consumption)),
      formatIDR(Math.round(b.sharedShare)),
      formatIDR(Math.round(b.totalTagihan)),
      formatIDR(Math.round(b.deposit)),
      formatIDR(Math.round(b.netDue)),
    ]),
    [
      { text: labels.colGrandTotal, bold: true, colSpan: 3 }, {}, {},
      { text: formatIDR(Math.round(settlement.grandTotal)), bold: true },
      { text: formatIDR(Math.round(settlement.totalDeposit)), bold: true },
      "",
    ],
  ];

  const paymentContent: unknown[] = [];
  if (pi.bankName || pi.accountNumber || pi.accountName) {
    paymentContent.push({
      text: `${labels.bankLabel}: ${pi.bankName ?? "-"}  |  ${labels.accountNumberLabel}: ${pi.accountNumber ?? "-"}  |  ${labels.accountNameLabel}: ${pi.accountName ?? "-"}`,
      style: "paymentInfo",
    });
  }
  if (pi.ewallet) paymentContent.push({ text: `${labels.ewalletLabel}: ${pi.ewallet}`, style: "paymentInfo" });
  if (pi.note) paymentContent.push({ text: `${labels.noteLabel}: ${pi.note}`, style: "paymentInfo" });

  const docDefinition = {
    content: [
      { text: session.name, style: "header" },
      { text: date, style: "subheader" },
      "\n",
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "auto"],
          body: tableBody,
        },
        layout: "lightHorizontalLines",
      },
      ...(paymentContent.length > 0
        ? ["\n", { text: labels.paymentInfoLabel, style: "sectionHeader" }, ...paymentContent]
        : []),
    ],
    styles: {
      header: { fontSize: 16, bold: true, marginBottom: 4 },
      subheader: { fontSize: 10, color: "#666666", marginBottom: 8 },
      sectionHeader: { fontSize: 11, bold: true, marginTop: 8, marginBottom: 4 },
      paymentInfo: { fontSize: 9, color: "#444444" },
    },
    defaultStyle: { fontSize: 9 },
    pageSize: "A4",
    pageMargins: [30, 30, 30, 30],
  };

  const exportDate = new Date().toISOString().split("T")[0];
  const safeName = session.name.replace(/[<>:"|?*\\/]/g, "_");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfMake as any).createPdf(docDefinition).download(`splitbro-${safeName}-${exportDate}.pdf`);
}
