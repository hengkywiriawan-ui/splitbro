"use client";

import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";
import type { Breakdown } from "@/lib/calc/settlement";
import type { ExportLabels } from "@/lib/export/excel";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { downloadExcel } from "@/lib/export/excel";
import { downloadPDF } from "@/lib/export/pdf";

type Settlement = { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number };

export function ExportButtons({
  session,
  restaurants,
  itemsByResto,
  sharedCosts,
  settlement,
}: {
  session: Session;
  restaurants: Restaurant[];
  itemsByResto: Record<string, Item[]>;
  sharedCosts: SharedCost[];
  settlement: Settlement;
}) {
  const { t } = useT();

  const labels: ExportLabels = {
    sheetSummary: t("export.sheet.summary"),
    sheetDetail: t("export.sheet.detail"),
    colName: t("member.field.name"),
    colConsumption: t("summary.field.consumption"),
    colSharedShare: t("summary.field.sharedShare"),
    colTotal: t("summary.field.total"),
    colDeposit: t("summary.field.deposit"),
    colNetDue: t("export.col.netDue"),
    colGrandTotal: t("summary.grandTotal"),
    colTotalDeposit: t("summary.totalDeposit"),
    colRestaurant: t("export.col.restaurant"),
    colDate: t("restaurant.field.date"),
    colTotalAfterTax: t("export.col.totalAfterTax"),
    colPerPerson: t("export.col.perPerson"),
    colItem: t("export.col.item"),
    colPrice: t("export.col.price"),
    colAssignedTo: t("export.col.assignedTo"),
    colSubtotalPerPerson: t("export.col.subtotalPerPerson"),
    sharedCostsLabel: t("summary.field.sharedShare"),
    allLabel: t("export.all"),
    paymentInfoLabel: t("export.paymentInfo"),
    bankLabel: t("export.payment.bank"),
    accountNumberLabel: t("export.payment.accountNumber"),
    accountNameLabel: t("export.payment.accountName"),
    ewalletLabel: t("export.payment.ewallet"),
    noteLabel: t("export.payment.note"),
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        variant="primary"
        onClick={() => void downloadExcel(session, restaurants, itemsByResto, sharedCosts, settlement, labels)}
      >
        {t("export.excel")}
      </Button>
      <Button
        variant="outline"
        onClick={() => void downloadPDF(session, settlement, labels)}
      >
        {t("export.pdf")}
      </Button>
    </div>
  );
}
