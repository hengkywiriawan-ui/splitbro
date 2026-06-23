"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useItems } from "@/lib/data/use-items";
import { ItemForm } from "@/components/items/ItemForm";
import { ItemList } from "@/components/items/ItemList";
import { Button } from "@/components/ui/Button";

function ItemsInner({ id, restaurantId }: { id: string; restaurantId: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { items, loading: itemsLoading, add, update, remove } = useItems(id, restaurantId);
  const [adding, setAdding] = useState(false);

  if (sessionLoading || itemsLoading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  if (session.mode === "equal") {
    return (
      <main className="mx-auto max-w-md p-4">
        <Link href={`/sessions/${id}/restaurants`} className="mb-4 inline-block text-sm text-blue-600">
          ← {t("restaurant.title")}
        </Link>
        <p className="text-gray-500">{t("item.equalModeOnly")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}/restaurants`} className="mb-4 inline-block text-sm text-blue-600">
        ← {t("restaurant.title")}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("item.title")}</h1>

      <ItemList
        items={items}
        members={session.members}
        onUpdate={async (itemId, values) => {
          await update(itemId, values);
        }}
        onRemove={async (itemId) => {
          await remove(itemId);
        }}
      />

      <div className="mt-4">
        {adding ? (
          <ItemForm
            members={session.members}
            onSubmit={async (values) => {
              await add(values);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button onClick={() => setAdding(true)}>{t("item.add")}</Button>
        )}
      </div>
    </main>
  );
}

export default function ItemsPage({
  params,
}: {
  params: Promise<{ id: string; restaurantId: string }>;
}) {
  const { id, restaurantId } = use(params);
  return (
    <AuthGuard>
      <ItemsInner id={id} restaurantId={restaurantId} />
    </AuthGuard>
  );
}
