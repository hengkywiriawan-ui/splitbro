import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";
import type { Breakdown } from "@/lib/calc/settlement";

function applyTaxLocal(
  base: number,
  r: { taxIncluded: boolean; taxRate: number }
): number {
  if (r.taxIncluded) return base;
  return base + (base * r.taxRate) / 100;
}

export async function downloadExcel(
  session: Session,
  restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>,
  sharedCosts: SharedCost[],
  settlement: { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number }
): Promise<void> {
  const XLSX = await import("xlsx");

  // Sheet 1: Ringkasan
  const summaryRows: (string | number)[][] = [
    ["Nama", "Konsumsi", "Biaya Bersama", "Total Tagihan", "Deposit", "Net Due"],
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
      "Grand Total",
      "",
      "",
      Math.round(settlement.grandTotal),
      Math.round(settlement.totalDeposit),
      "",
    ],
  ];

  const pi = session.paymentInfo;
  summaryRows.push([], ["Info Pembayaran", ""]);
  if (pi.bankName) summaryRows.push(["Bank", pi.bankName]);
  if (pi.accountNumber) summaryRows.push(["No. Rekening", pi.accountNumber]);
  if (pi.accountName) summaryRows.push(["Atas Nama", pi.accountName]);
  if (pi.ewallet) summaryRows.push(["E-Wallet", pi.ewallet]);
  if (pi.note) summaryRows.push(["Catatan", pi.note]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  // Sheet 2: Detail
  const detailRows: (string | number)[][] = [];
  const N = session.members.length || 1;

  if (session.mode === "equal") {
    detailRows.push(["Restoran", "Tanggal", "Total (after tax)", "Per Orang"]);
    for (const r of restaurants) {
      const effectiveTotal = applyTaxLocal(r.totalAmount ?? 0, r);
      detailRows.push([
        r.name,
        r.date ?? "",
        Math.round(effectiveTotal),
        Math.round(effectiveTotal / N),
      ]);
    }
  } else {
    detailRows.push([
      "Restoran",
      "Item",
      "Harga",
      "Assigned To",
      "Subtotal Per Orang",
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
      detailRows.push([], ["Biaya Bersama", "", "", "", ""]);
      for (const sc of sharedCosts) {
        detailRows.push([
          sc.name,
          "",
          Math.round(sc.amount),
          "Semua",
          Math.round(sc.amount / N),
        ]);
      }
    }
  }

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, "Detail");

  const date = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `splitbro-${session.name}-${date}.xlsx`);
}
