"use client";

import { use } from "react";
import type { Session } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { usePublicSession } from "@/lib/data/use-public-session";
import { computeSettlement } from "@/lib/calc/settlement";
import { BreakdownTable } from "@/components/summary/BreakdownTable";
import { RestaurantReport } from "@/components/share/RestaurantReport";

function formatShareDate(ms: number): string {
  return new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function PaymentInfoBlock({ session }: { session: Session }) {
  const { t } = useT();
  const pi = session.paymentInfo;
  const hasInfo = pi.bankName || pi.accountNumber || pi.accountName || pi.ewallet || pi.note;
  if (!hasInfo) return null;
  return (
    <div className="mt-4 rounded-xl border border-border-subtle bg-surface-gray p-4 text-sm">
      {(pi.bankName || pi.accountNumber || pi.accountName) && (
        <p>
          {[pi.bankName, pi.accountNumber, pi.accountName].filter(Boolean).join(" · ")}
        </p>
      )}
      {pi.ewallet && <p className="mt-1">{t("export.payment.ewallet")}: {pi.ewallet}</p>}
      {pi.note && <p className="mt-1 text-ink-muted">{pi.note}</p>}
    </div>
  );
}

function ShareInner({ token }: { token: string }) {
  const { t } = useT();
  const { session, restaurants, itemsByResto, sharedCosts, loading, notFound, expired } =
    usePublicSession(token);

  if (loading) return null;
  if (expired) return <p className="p-4">{t("share.expired")}</p>;
  if (notFound || !session) return <p className="p-4">{t("share.notFound")}</p>;

  const settlement = computeSettlement(session, restaurants, itemsByResto, sharedCosts);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <header className="mb-5 rounded-xl bg-primary p-5 premium-shadow">
        <p className="label-caps text-gold">{t("share.title")}</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{session.name}</h1>
        <p className="mt-2 text-xs text-white/60">
          {t("share.validUntil")} {formatShareDate(session.shareExpiresAt)}
        </p>
      </header>
      <BreakdownTable
        breakdown={settlement.breakdown}
        grandTotal={settlement.grandTotal}
        totalDeposit={settlement.totalDeposit}
      />
      <RestaurantReport
        restaurants={restaurants}
        itemsByResto={itemsByResto}
        mode={session.mode}
        members={session.members}
      />
      <PaymentInfoBlock session={session} />
    </main>
  );
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <ShareInner token={token} />;
}
