import type { Item, NewItemInput, ItemPatch } from "@/lib/types";
import type { ItemRepository } from "./types";

function storageKey(sessionId: string, restaurantId: string): string {
  return `splitbro:items:${sessionId}:${restaurantId}`;
}

function readAll(sessionId: string, restaurantId: string): Item[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey(sessionId, restaurantId));
  return raw ? (JSON.parse(raw) as Item[]) : [];
}

function writeAll(sessionId: string, restaurantId: string, items: Item[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(sessionId, restaurantId), JSON.stringify(items));
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export const mockItemRepo: ItemRepository = {
  async list(sessionId, restaurantId) {
    return readAll(sessionId, restaurantId);
  },

  async get(sessionId, restaurantId, itemId) {
    return readAll(sessionId, restaurantId).find((i) => i.itemId === itemId) ?? null;
  },

  async create(input: NewItemInput) {
    const all = readAll(input.sessionId, input.restaurantId);
    const item: Item = {
      itemId: uid(),
      sessionId: input.sessionId,
      restaurantId: input.restaurantId,
      name: input.name,
      price: input.price,
      assignedTo: input.assignedTo,
    };
    writeAll(input.sessionId, input.restaurantId, [...all, item]);
    return item;
  },

  async update(sessionId, restaurantId, itemId, patch: ItemPatch) {
    const all = readAll(sessionId, restaurantId);
    const idx = all.findIndex((i) => i.itemId === itemId);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...patch };
    writeAll(sessionId, restaurantId, all);
  },

  async delete(sessionId, restaurantId, itemId) {
    writeAll(
      sessionId,
      restaurantId,
      readAll(sessionId, restaurantId).filter((i) => i.itemId !== itemId)
    );
  },
};
