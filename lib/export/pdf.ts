import type { Session } from "@/lib/types";
import type { Breakdown } from "@/lib/calc/settlement";
import { formatIDR } from "@/lib/format";

export async function downloadPDF(
  session: Session,
  settlement: { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number }
): Promise<void> {
  // Dynamic imports prevent SSR errors — pdfmake references browser globals at module init.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = ((await import("pdfmake/build/pdfmake")) as any).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = ((await import("pdfmake/build/vfs_fonts")) as any).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfMake as any).vfs = pdfFonts?.pdfMake?.vfs ?? pdfFonts?.vfs;

  const date = new Date().toLocaleDateString("id-ID");
  const pi = session.paymentInfo;

  const tableBody: unknown[][] = [
    [
      { text: "Nama", bold: true, fillColor: "#f3f4f6" },
      { text: "Konsumsi", bold: true, fillColor: "#f3f4f6" },
      { text: "Biaya Bersama", bold: true, fillColor: "#f3f4f6" },
      { text: "Total", bold: true, fillColor: "#f3f4f6" },
      { text: "Deposit", bold: true, fillColor: "#f3f4f6" },
      { text: "Net Due", bold: true, fillColor: "#f3f4f6" },
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
      { text: "Grand Total", bold: true, colSpan: 3 }, {}, {},
      { text: formatIDR(Math.round(settlement.grandTotal)), bold: true },
      { text: formatIDR(Math.round(settlement.totalDeposit)), bold: true },
      "",
    ],
  ];

  const paymentContent: unknown[] = [];
  if (pi.bankName || pi.accountNumber || pi.accountName) {
    paymentContent.push({
      text: `Bank: ${pi.bankName ?? "-"}  |  No. Rek: ${pi.accountNumber ?? "-"}  |  Atas Nama: ${pi.accountName ?? "-"}`,
      style: "paymentInfo",
    });
  }
  if (pi.ewallet) paymentContent.push({ text: `E-Wallet: ${pi.ewallet}`, style: "paymentInfo" });
  if (pi.note) paymentContent.push({ text: `Catatan: ${pi.note}`, style: "paymentInfo" });

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
        ? ["\n", { text: "Info Pembayaran", style: "sectionHeader" }, ...paymentContent]
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
