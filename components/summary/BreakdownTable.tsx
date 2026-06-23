"use client";

import { useState } from "react";
import type { Breakdown } from "@/lib/calc/settlement";
import { useT } from "@/lib/i18n/provider";
import { formatIDR } from "@/lib/format";
import { Card } from "@/components/ui/Card";

export function BreakdownTable({
  breakdown,
  grandTotal,
  totalDeposit,
}: {
  breakdown: Breakdown[];
  grandTotal: number;
  totalDeposit: number;
}) {
  const { t } = useT();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (breakdown.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {breakdown.map((b) => {
        const isExpanded = expandedId === b.memberId;
        // Math.round happens HERE (display time), never in computeSettlement
        const netRounded = Math.round(b.netDue);
        const netLabel =
          netRounded > 0
            ? t("summary.netDue.owe")
            : netRounded < 0
            ? t("summary.netDue.refund")
            : t("summary.netDue.settled");
        const netColor =
          netRounded > 0
            ? "text-red-600"
            : netRounded < 0
            ? "text-green-600"
            : "text-gray-500";

        return (
          // Card has no onClick prop — wrap in div to handle tap/click
          <div
            key={b.memberId}
            className="cursor-pointer"
            onClick={() => setExpandedId(isExpanded ? null : b.memberId)}
          >
            <Card>
              <div className="flex items-center justify-between">
                <span className="font-medium">{b.name}</span>
                <span className={`text-sm font-semibold ${netColor}`}>
                  {netLabel}: {formatIDR(Math.abs(netRounded))}
                </span>
              </div>

              {isExpanded && (
                <div className="mt-3 flex flex-col gap-1 border-t pt-3">
                  <BreakdownRow label={t("summary.field.consumption")} value={b.consumption} />
                  <BreakdownRow label={t("summary.field.sharedShare")} value={b.sharedShare} />
                  <BreakdownRow label={t("summary.field.total")} value={b.totalTagihan} bold />
                  <BreakdownRow label={t("summary.field.deposit")} value={b.deposit} />
                  <BreakdownRow
                    label={netLabel}
                    value={Math.abs(b.netDue)}
                    colorClass={netColor}
                    bold
                  />
                </div>
              )}
            </Card>
          </div>
        );
      })}

      <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{t("summary.grandTotal")}</span>
          <span className="font-bold">{formatIDR(Math.round(grandTotal))}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{t("summary.totalDeposit")}</span>
          <span>{formatIDR(Math.round(totalDeposit))}</span>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  bold = false,
  colorClass = "text-gray-700",
}: {
  label: string;
  value: number;
  bold?: boolean;
  colorClass?: string;
}) {
  return (
    <div className={`flex justify-between text-sm ${colorClass}`}>
      <span>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{formatIDR(Math.round(value))}</span>
    </div>
  );
}
