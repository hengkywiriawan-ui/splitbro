"use client";

import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";
import type { Breakdown } from "@/lib/calc/settlement";
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
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        onClick={() => void downloadExcel(session, restaurants, itemsByResto, sharedCosts, settlement)}
      >
        {t("export.excel")}
      </Button>
      <Button
        variant="secondary"
        onClick={() => void downloadPDF(session, settlement)}
      >
        {t("export.pdf")}
      </Button>
    </div>
  );
}
