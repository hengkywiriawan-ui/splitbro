"use client";

import { use } from "react";
import type { Session } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { usePublicSession } from "@/lib/data/use-public-session";
import { computeSettlement } from "@/lib/calc/settlement";
import { BreakdownTable } from "@/components/summary/BreakdownTable";

function PaymentInfoBlock({ session }: { session: Session }) {
  const pi = session.paymentInfo;
  const hasInfo = pi.bankName || pi.accountNumber || pi.accountName || pi.ewallet || pi.note;
  if (!hasInfo) return null;
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
      {(pi.bankName || pi.accountNumber || pi.accountName) && (
        <p>
          {[pi.bankName, pi.accountNumber, pi.accountName].filter(Boolean).join(" · ")}
        </p>
      )}
      {pi.ewallet && <p className="mt-1">E-Wallet: {pi.ewallet}</p>}
      {pi.note && <p className="mt-1 text-gray-500">{pi.note}</p>}
    </div>
  );
}

function ShareInner({ token }: { token: string }) {
  const { t } = useT();
  const { session, restaurants, itemsByResto, sharedCosts, loading, notFound } =
    usePublicSession(token);

  if (loading) return null;
  if (notFound || !session) return <p className="p-4">{t("share.notFound")}</p>;

  const settlement = computeSettlement(session, restaurants, itemsByResto, sharedCosts);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-1 text-xl font-bold">{session.name}</h1>
      <p className="mb-4 text-sm text-gray-500">{t("share.title")}</p>
      <BreakdownTable
        breakdown={settlement.breakdown}
        grandTotal={settlement.grandTotal}
        totalDeposit={settlement.totalDeposit}
      />
      <PaymentInfoBlock session={session} />
    </main>
  );
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <ShareInner token={token} />;
}
