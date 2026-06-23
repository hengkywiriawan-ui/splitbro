"use client";

import { useEffect, useState } from "react";
import type { Item, Restaurant, Session, SharedCost } from "@/lib/types";
import { getSessionRepo } from "@/lib/data/index";
import { getRestaurantRepo } from "@/lib/data/restaurant-repo/index";
import { getItemRepo } from "@/lib/data/item-repo/index";
import { getSharedCostRepo } from "@/lib/data/shared-cost-repo/index";

export function usePublicSession(token: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [itemsByResto, setItemsByResto] = useState<Record<string, Item[]>>({});
  const [sharedCosts, setSharedCosts] = useState<SharedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const found = await getSessionRepo().findByShareToken(token);
      if (!found) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSession(found);
      const [restos, costs] = await Promise.all([
        getRestaurantRepo().list(found.id),
        getSharedCostRepo().list(found.id),
      ]);
      setRestaurants(restos);
      setSharedCosts(costs);
      if (found.mode === "item_based") {
        const itemRepo = getItemRepo();
        const entries = await Promise.all(
          restos.map(
            async (r) => [r.restaurantId, await itemRepo.list(found.id, r.restaurantId)] as const
          )
        );
        setItemsByResto(Object.fromEntries(entries));
      }
      setLoading(false);
    }
    void load();
  }, [token]);

  return { session, restaurants, itemsByResto, sharedCosts, loading, notFound };
}
