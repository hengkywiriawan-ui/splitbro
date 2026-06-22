"use client";

import { useCallback, useEffect, useState } from "react";
import type { Item, NewItemInput, ItemPatch } from "@/lib/types";
import { getItemRepo } from "./item-repo/index";

export function useItems(sessionId: string, restaurantId: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const repo = getItemRepo();
    setLoading(true);
    setItems(await repo.list(sessionId, restaurantId));
    setLoading(false);
  }, [sessionId, restaurantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (input: Omit<NewItemInput, "sessionId" | "restaurantId">) => {
      const repo = getItemRepo();
      const item = await repo.create({ ...input, sessionId, restaurantId });
      await refresh();
      return item;
    },
    [sessionId, restaurantId, refresh]
  );

  const update = useCallback(
    async (itemId: string, patch: ItemPatch) => {
      const repo = getItemRepo();
      await repo.update(sessionId, restaurantId, itemId, patch);
      await refresh();
    },
    [sessionId, restaurantId, refresh]
  );

  const remove = useCallback(
    async (itemId: string) => {
      const repo = getItemRepo();
      await repo.delete(sessionId, restaurantId, itemId);
      await refresh();
    },
    [sessionId, restaurantId, refresh]
  );

  return { items, loading, add, update, remove, refresh };
}
