"use client";

import { useCallback, useEffect, useState } from "react";
import type { NewRestaurantInput, Restaurant, RestaurantPatch } from "@/lib/types";
import { getRestaurantRepo } from "./restaurant-repo/index";

export function useRestaurants(sessionId: string) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const repo = getRestaurantRepo();
    setLoading(true);
    setRestaurants(await repo.list(sessionId));
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (input: Omit<NewRestaurantInput, "sessionId">) => {
      const repo = getRestaurantRepo();
      const r = await repo.create({ ...input, sessionId });
      await refresh();
      return r;
    },
    [sessionId, refresh]
  );

  const update = useCallback(
    async (restaurantId: string, patch: RestaurantPatch) => {
      const repo = getRestaurantRepo();
      await repo.update(sessionId, restaurantId, patch);
      await refresh();
    },
    [sessionId, refresh]
  );

  const remove = useCallback(
    async (restaurantId: string) => {
      const repo = getRestaurantRepo();
      await repo.delete(sessionId, restaurantId);
      await refresh();
    },
    [sessionId, refresh]
  );

  return { restaurants, loading, add, update, remove, refresh };
}
