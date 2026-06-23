"use client";

import { use, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useSharedCosts } from "@/lib/data/use-shared-costs";
import { SharedCostForm } from "@/components/shared-costs/SharedCostForm";
import { SharedCostList } from "@/components/shared-costs/SharedCostList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { PageHeader } from "@/components/ui/PageHeader";

function SharedCostsInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { sharedCosts, loading: costsLoading, add, update, remove } = useSharedCosts(id);
  const [adding, setAdding] = useState(false);

  if (sessionLoading || costsLoading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  const totalPool = sharedCosts.reduce((s, c) => s + c.amount, 0);
  const perMember = session.members.length > 0 ? totalPool / session.members.length : 0;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-12">
      <PageHeader title={t("sharedCost.title")} backHref={`/sessions/${id}`} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Card variant="dark">
          <p className="label-caps text-white/60">{t("sharedCost.totalPool")}</p>
          <Money amount={totalPool} tone="gold" className="mt-1 block text-2xl" />
        </Card>
        <Card featured>
          <p className="label-caps text-ink-muted">{t("sharedCost.perMember")}</p>
          <Money amount={perMember} tone="primary" className="mt-1 block text-2xl" />
        </Card>
      </div>

      <SharedCostList
        sharedCosts={sharedCosts}
        onUpdate={async (costId, values) => {
          await update(costId, values);
        }}
        onRemove={async (costId) => {
          await remove(costId);
        }}
      />

      <div className="mt-4">
        {adding ? (
          <SharedCostForm
            onSubmit={async (values) => {
              await add(values);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button onClick={() => setAdding(true)}>{t("sharedCost.add")}</Button>
        )}
      </div>
    </main>
  );
}

export default function SharedCostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <SharedCostsInner id={id} />
    </AuthGuard>
  );
}
