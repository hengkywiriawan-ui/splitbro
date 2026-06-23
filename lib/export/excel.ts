import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";
import type { Breakdown } from "@/lib/calc/settlement";
import { applyTax } from "@/lib/calc/settlement";

export type ExportLabels = {
  sheetSummary: string;
  sheetDetail: string;
  colName: string;
  colConsumption: string;
  colSharedShare: string;
  colTotal: string;
  colDeposit: string;
  colNetDue: string;
  colGrandTotal: string;
  colTotalDeposit: string;
  colRestaurant: string;
  colDate: string;
  colTotalAfterTax: string;
  colPerPerson: string;
  colItem: string;
  colPrice: string;
  colAssignedTo: string;
  colSubtotalPerPerson: string;
  sharedCostsLabel: string;
  allLabel: string;
  paymentInfoLabel: string;
  bankLabel: string;
  accountNumberLabel: string;
  accountNameLabel: string;
  ewalletLabel: string;
  noteLabel: string;
};

export async function downloadExcel(
  session: Session,
  restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>,
  sharedCosts: SharedCost[],
  settlement: { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number },
  labels: ExportLabels
): Promise<void> {
  const XLSX = await import("xlsx");

  // Sheet 1: Summary
  const summaryRows: (string | number)[][] = [
    [labels.colName, labels.colConsumption, labels.colSharedShare, labels.colTotal, labels.colDeposit, labels.colNetDue],
    ...settlement.breakdown.map((b) => [
      b.name,
      Math.round(b.consumption),
      Math.round(b.sharedShare),
      Math.round(b.totalTagihan),
      Math.round(b.deposit),
      Math.round(b.netDue),
    ]),
    [],
    [
      labels.colGrandTotal,
      "",
      "",
      Math.round(settlement.grandTotal),
      Math.round(settlement.totalDeposit),
      "",
    ],
  ];

  const pi = session.paymentInfo;
  summaryRows.push([], [labels.paymentInfoLabel, ""]);
  if (pi.bankName) summaryRows.push([labels.bankLabel, pi.bankName]);
  if (pi.accountNumber) summaryRows.push([labels.accountNumberLabel, pi.accountNumber]);
  if (pi.accountName) summaryRows.push([labels.accountNameLabel, pi.accountName]);
  if (pi.ewallet) summaryRows.push([labels.ewalletLabel, pi.ewallet]);
  if (pi.note) summaryRows.push([labels.noteLabel, pi.note]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, labels.sheetSummary);

  // Sheet 2: Detail
  const detailRows: (string | number)[][] = [];
  const N = session.members.length || 1;

  if (session.mode === "equal") {
    detailRows.push([labels.colRestaurant, labels.colDate, labels.colTotalAfterTax, labels.colPerPerson]);
    for (const r of restaurants) {
      const effectiveTotal = applyTax(r.totalAmount ?? 0, r);
      detailRows.push([
        r.name,
        r.date ?? "",
        Math.round(effectiveTotal),
        Math.round(effectiveTotal / N),
      ]);
    }
    if (sharedCosts.length > 0) {
      detailRows.push([], [labels.sharedCostsLabel, "", "", ""]);
      for (const sc of sharedCosts) {
        detailRows.push([sc.name, "", Math.round(sc.amount), Math.round(sc.amount / N)]);
      }
    }
  } else {
    detailRows.push([
      labels.colRestaurant,
      labels.colItem,
      labels.colPrice,
      labels.colAssignedTo,
      labels.colSubtotalPerPerson,
    ]);
    for (const r of restaurants) {
      const items = itemsByResto[r.restaurantId] ?? [];
      for (const item of items) {
        const assignedNames = item.assignedTo
          .map(
            (id) =>
              session.members.find((m) => m.memberId === id)?.name ?? "?"
          )
          .join(", ");
        detailRows.push([
          r.name,
          item.name,
          Math.round(item.price),
          assignedNames,
          Math.round(item.price / (item.assignedTo.length || 1)),
        ]);
      }
    }
    if (sharedCosts.length > 0) {
      detailRows.push([], [labels.sharedCostsLabel, "", "", "", ""]);
      for (const sc of sharedCosts) {
        detailRows.push([
          sc.name,
          "",
          Math.round(sc.amount),
          labels.allLabel,
          Math.round(sc.amount / N),
        ]);
      }
    }
  }

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, labels.sheetDetail);

  const date = new Date().toISOString().split("T")[0];
  const safeName = session.name.replace(/[<>:"|?*\\/]/g, "_");
  XLSX.writeFile(wb, `splitbro-${safeName}-${date}.xlsx`);
}
