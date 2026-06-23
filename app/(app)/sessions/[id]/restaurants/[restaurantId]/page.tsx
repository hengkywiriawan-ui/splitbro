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
import { OcrScanner } from "@/components/items/OcrScanner";
import type { ParsedItem } from "@/lib/ocr/use-ocr";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

function ItemsInner({ id, restaurantId }: { id: string; restaurantId: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { items, loading: itemsLoading, add, update, remove } = useItems(id, restaurantId);
  const [adding, setAdding] = useState(false);
  const [prefillQueue, setPrefillQueue] = useState<ParsedItem[]>([]);

  function handleOcrItems(parsed: ParsedItem[]) {
    setPrefillQueue(parsed);
    if (parsed.length > 0) setAdding(true);
  }

  if (sessionLoading || itemsLoading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  if (session.mode === "equal") {
    return (
      <main className="mx-auto max-w-md p-4">
        <Link href={`/sessions/${id}/restaurants`} className="mb-4 inline-block text-sm font-medium text-primary hover:text-gold">
          ← {t("restaurant.title")}
        </Link>
        <p className="text-ink-muted">{t("item.equalModeOnly")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <PageHeader title={t("item.title")} backHref={`/sessions/${id}/restaurants`} />

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
            initial={
              prefillQueue.length > 0
                ? { name: prefillQueue[0].name, price: prefillQueue[0].price, assignedTo: [] }
                : undefined
            }
            onSubmit={async (values) => {
              await add(values);
              const remaining = prefillQueue.slice(1);
              setPrefillQueue(remaining);
              if (remaining.length === 0) setAdding(false);
            }}
            onCancel={() => {
              setAdding(false);
              setPrefillQueue([]);
            }}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <Button onClick={() => setAdding(true)}>{t("item.add")}</Button>
            <OcrScanner onAddItems={handleOcrItems} />
          </div>
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
