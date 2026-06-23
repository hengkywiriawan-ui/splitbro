"use client";

import { useState } from "react";
import type { Breakdown } from "@/lib/calc/settlement";
import { useT } from "@/lib/i18n/provider";
import { Money } from "@/components/ui/Money";
import { Avatar } from "@/components/ui/Avatar";

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

  // Rounding happens HERE (display time), never in computeSettlement.
  const balance = grandTotal - totalDeposit;

  return (
    <div className="flex flex-col gap-5">
      {/* Grand total hero */}
      <div className="rounded-xl bg-primary p-5 text-white shadow-sm">
        <p className="label-caps text-white/70">{t("summary.grandTotal")}</p>
        <Money amount={grandTotal} className="!text-white" tone="default" />
        <div className="mt-4 flex justify-between border-t border-white/20 pt-3 text-sm">
          <div>
            <p className="text-white/70">{t("summary.totalDeposit")}</p>
            <span className="font-num">{moneyPlain(totalDeposit)}</span>
          </div>
          <div className="text-right">
            <p className="text-white/70">{t("summary.balance")}</p>
            <span className="font-num">{moneyPlain(balance)}</span>
          </div>
        </div>
      </div>

      {/* Member settlement */}
      <div>
        <h2 className="label-caps mb-3 text-ink-muted">{t("summary.memberSettlement")}</h2>
        <div className="flex flex-col gap-2">
          {breakdown.map((b) => {
            const isExpanded = expandedId === b.memberId;
            const netRounded = Math.round(b.netDue);
            const netLabel =
              netRounded > 0
                ? t("summary.netDue.owe")
                : netRounded < 0
                ? t("summary.netDue.refund")
                : t("summary.netDue.settled");
            const tone = netRounded > 0 ? "owe" : netRounded < 0 ? "refund" : "muted";

            return (
              <div
                key={b.memberId}
                className="cursor-pointer rounded-lg border border-border-subtle bg-card p-3"
                onClick={() => setExpandedId(isExpanded ? null : b.memberId)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={b.name} />
                    <span className="truncate font-semibold">{b.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="label-caps text-ink-muted">{netLabel}</p>
                    <Money amount={Math.abs(netRounded)} tone={tone} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-1 border-t border-border-subtle pt-3">
                    <Row label={t("summary.field.consumption")} value={b.consumption} />
                    <Row label={t("summary.field.sharedShare")} value={b.sharedShare} />
                    <Row label={t("summary.field.total")} value={b.totalTagihan} bold />
                    <Row label={t("summary.field.deposit")} value={b.deposit} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function moneyPlain(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

function Row({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className={`font-num ${bold ? "font-bold text-ink" : "text-ink"}`}>{moneyPlain(value)}</span>
    </div>
  );
}
