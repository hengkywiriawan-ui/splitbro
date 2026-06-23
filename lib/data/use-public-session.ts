"use client";

import { useEffect, useState } from "react";
import type { Item, Restaurant, Session, SharedCost } from "@/lib/types";
import { getSessionRepo } from "@/lib/data/index";
import { getRestaurantRepo } from "@/lib/data/restaurant-repo/index";
import { getItemRepo } from "@/lib/data/item-repo/index";
import { getSharedCostRepo } from "@/lib/data/shared-cost-repo/index";

type SharePayload = {
  session: Session;
  restaurants: Restaurant[];
  itemsByResto: Record<string, Item[]>;
  sharedCosts: SharedCost[];
};

export function usePublicSession(token: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [itemsByResto, setItemsByResto] = useState<Record<string, Item[]>>({});
  const [sharedCosts, setSharedCosts] = useState<SharedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadViaApi() {
      const res = await fetch(`/api/share/${encodeURIComponent(token)}`);
      if (!res.ok) {
        if (!cancelled) setNotFound(true);
        return;
      }
      const data = (await res.json()) as SharePayload;
      if (cancelled) return;
      setSession(data.session);
      setRestaurants(data.restaurants);
      setItemsByResto(data.itemsByResto);
      setSharedCosts(data.sharedCosts);
    }

    async function loadViaMock() {
      const found = await getSessionRepo().findByShareToken(token);
      if (!found) {
        if (!cancelled) setNotFound(true);
        return;
      }
      if (cancelled) return;
      setSession(found);
      const [restos, costs] = await Promise.all([
        getRestaurantRepo().list(found.id),
        getSharedCostRepo().list(found.id),
      ]);
      if (cancelled) return;
      setRestaurants(restos);
      setSharedCosts(costs);
      if (found.mode === "item_based") {
        const itemRepo = getItemRepo();
        const entries = await Promise.all(
          restos.map(
            async (r) => [r.restaurantId, await itemRepo.list(found.id, r.restaurantId)] as const
          )
        );
        if (!cancelled) setItemsByResto(Object.fromEntries(entries));
      }
    }

    async function load() {
      try {
        setLoading(true);
        const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
        if (backend === "firebase") {
          await loadViaApi();
        } else {
          await loadViaMock();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { session, restaurants, itemsByResto, sharedCosts, loading, notFound };
}
