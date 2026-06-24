import type { Restaurant, NewRestaurantInput, RestaurantPatch } from "@/lib/types";
import type { RestaurantRepository } from "./types";

function storageKey(sessionId: string): string {
  return `splitbro:restaurants:${sessionId}`;
}

function readAll(sessionId: string): Restaurant[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey(sessionId));
  return raw ? (JSON.parse(raw) as Restaurant[]) : [];
}

function writeAll(sessionId: string, restaurants: Restaurant[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(sessionId), JSON.stringify(restaurants));
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export const mockRestaurantRepo: RestaurantRepository = {
  async list(sessionId) {
    return readAll(sessionId).sort((a, b) => a.order - b.order);
  },

  async get(sessionId, restaurantId) {
    return readAll(sessionId).find((r) => r.restaurantId === restaurantId) ?? null;
  },

  async create(input: NewRestaurantInput) {
    const all = readAll(input.sessionId);
    const restaurant: Restaurant = {
      restaurantId: uid(),
      sessionId: input.sessionId,
      name: input.name,
      date: input.date ?? null,
      order: input.order ?? all.length,
      taxIncluded: input.taxIncluded ?? false,
      taxRate: input.taxRate ?? 11,
      totalAmount: input.totalAmount ?? null,
      participantIds: input.participantIds ?? [],
    };
    writeAll(input.sessionId, [...all, restaurant]);
    return restaurant;
  },

  async update(sessionId, restaurantId, patch: RestaurantPatch) {
    const all = readAll(sessionId);
    const idx = all.findIndex((r) => r.restaurantId === restaurantId);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...patch };
    writeAll(sessionId, all);
  },

  async delete(sessionId, restaurantId) {
    writeAll(sessionId, readAll(sessionId).filter((r) => r.restaurantId !== restaurantId));
  },
};
