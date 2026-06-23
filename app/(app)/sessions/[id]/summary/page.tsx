"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useRestaurants } from "@/lib/data/use-restaurants";
import { useSharedCosts } from "@/lib/data/use-shared-costs";
import { getItemRepo } from "@/lib/data/item-repo/index";
import { computeSettlement } from "@/lib/calc/settlement";
import { BreakdownTable } from "@/components/summary/BreakdownTable";
import { ExportButtons } from "@/components/summary/ExportButtons";
import { Button } from "@/components/ui/Button";
import type { Item } from "@/lib/types";

function SummaryInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { restaurants, loading: restoLoading } = useRestaurants(id);
  const { sharedCosts, loading: costsLoading } = useSharedCosts(id);
  const [itemsByResto, setItemsByResto] = useState<Record<string, Item[]>>({});
  const [itemsLoading, setItemsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session || session.mode !== "item_based" || restaurants.length === 0) {
      setItemsByResto({});
      return;
    }
    let cancelled = false;
    setItemsLoading(true);
    const repo = getItemRepo();
    Promise.all(
      restaurants.map(async (r) => [r.restaurantId, await repo.list(id, r.restaurantId)] as const)
    )
      .then((entries) => {
        if (cancelled) return;
        setItemsByResto(Object.fromEntries(entries));
      })
      .finally(() => {
        if (!cancelled) setItemsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, session?.mode, restaurants]);

  const loading = sessionLoading || restoLoading || costsLoading || itemsLoading;
  if (loading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  const settlement = computeSettlement(session, restaurants, itemsByResto, sharedCosts);

  async function handleCopyLink() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/share/${session!.shareToken}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}`} className="mb-4 inline-block text-sm text-blue-600">
        ← {session.name}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("summary.title")}</h1>

      <BreakdownTable
        breakdown={settlement.breakdown}
        grandTotal={settlement.grandTotal}
        totalDeposit={settlement.totalDeposit}
      />

      <div className="mt-6 flex flex-col gap-3">
        <ExportButtons
          session={session}
          restaurants={restaurants}
          itemsByResto={itemsByResto}
          sharedCosts={sharedCosts}
          settlement={settlement}
        />
        <Button variant="secondary" onClick={() => void handleCopyLink()}>
          {copied ? t("summary.linkCopied") : t("summary.copyLink")}
        </Button>
      </div>
    </main>
  );
}

export default function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <SummaryInner id={id} />
    </AuthGuard>
  );
}
