"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useSharedCosts } from "@/lib/data/use-shared-costs";
import { SharedCostForm } from "@/components/shared-costs/SharedCostForm";
import { SharedCostList } from "@/components/shared-costs/SharedCostList";
import { Button } from "@/components/ui/Button";

function SharedCostsInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { sharedCosts, loading: costsLoading, add, update, remove } = useSharedCosts(id);
  const [adding, setAdding] = useState(false);

  if (sessionLoading || costsLoading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}`} className="mb-4 inline-block text-sm text-blue-600">
        ← {session.name}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("sharedCost.title")}</h1>

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
