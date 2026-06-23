"use client";

import { use, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageHeader } from "@/components/ui/PageHeader";
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
import { SHARE_TTL_MS } from "@/lib/types";

function formatShareDate(ms: number): string {
  return new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Copy must be initiated directly inside the click gesture. In PWA/standalone on
// mobile, an awaited async call before this would drop the user activation and
// the Clipboard API is rejected — so we copy first, then fall back to execCommand.
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function SummaryInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading, update } = useSession(id, user?.uid ?? null);
  const { restaurants, loading: restoLoading } = useRestaurants(id);
  const { sharedCosts, loading: costsLoading } = useSharedCosts(id);
  const [itemsByResto, setItemsByResto] = useState<Record<string, Item[]>>({});
  const [itemsLoading, setItemsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);

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
  const linkExpired = Date.now() > session.shareExpiresAt;

  async function handleCopyLink() {
    const url = `${window.location.origin}/share/${session!.shareToken}`;
    setShareUrl(url);
    // Copy FIRST, while the user activation is still valid (critical for PWA).
    const ok = await copyToClipboard(url);
    // Refresh the 10-day validity afterwards (also revives an expired link).
    void update({ shareExpiresAt: Date.now() + SHARE_TTL_MS });
    if (ok) {
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyFailed(true);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <PageHeader title={session.name} backHref={`/sessions/${id}`} />

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
          {copied
            ? t("summary.linkCopied")
            : linkExpired
              ? t("summary.generateNew")
              : t("summary.copyLink")}
        </Button>
        <p className="text-center text-xs text-ink-muted">
          {linkExpired
            ? t("summary.linkExpiredHint")
            : `${t("summary.linkValidUntil")} ${formatShareDate(session.shareExpiresAt)}`}
        </p>
        {copyFailed && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-ink-muted">{t("summary.copyManual")}</p>
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-lg border border-border-subtle bg-surface-gray px-3 py-2 text-sm"
            />
          </div>
        )}
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
