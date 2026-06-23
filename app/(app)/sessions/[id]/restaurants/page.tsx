"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { useSession } from "@/lib/data/use-session";
import { useRestaurants } from "@/lib/data/use-restaurants";
import { RestaurantForm } from "@/components/restaurants/RestaurantForm";
import { RestaurantList } from "@/components/restaurants/RestaurantList";
import { Button } from "@/components/ui/Button";

function RestaurantsInner({ id }: { id: string }) {
  const { user } = useAuth();
  const { t } = useT();
  const { session, loading: sessionLoading } = useSession(id, user?.uid ?? null);
  const { restaurants, loading: restoLoading, add, update, remove } = useRestaurants(id);
  const [adding, setAdding] = useState(false);

  if (sessionLoading || restoLoading) return null;
  if (!session) return <p className="p-4">{t("session.notFound")}</p>;

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/sessions/${id}`} className="mb-4 inline-block text-sm text-blue-600">
        ← {session.name}
      </Link>
      <h1 className="mb-4 text-xl font-bold">{t("restaurant.title")}</h1>

      <RestaurantList
        restaurants={restaurants}
        sessionMode={session.mode}
        defaultTaxRate={session.defaultTaxRate}
        sessionId={id}
        onUpdate={async (restaurantId, values) => {
          await update(restaurantId, values);
        }}
        onRemove={async (restaurantId) => {
          await remove(restaurantId);
        }}
      />

      <div className="mt-4">
        {adding ? (
          <RestaurantForm
            sessionMode={session.mode}
            defaultTaxRate={session.defaultTaxRate}
            onSubmit={async (values) => {
              await add(values);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button onClick={() => setAdding(true)}>{t("restaurant.add")}</Button>
        )}
      </div>
    </main>
  );
}

export default function RestaurantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <RestaurantsInner id={id} />
    </AuthGuard>
  );
}
