import type { Item, NewItemInput, ItemPatch } from "@/lib/types";

export interface ItemRepository {
  list(sessionId: string, restaurantId: string): Promise<Item[]>;
  get(sessionId: string, restaurantId: string, itemId: string): Promise<Item | null>;
  create(input: NewItemInput): Promise<Item>;
  update(sessionId: string, restaurantId: string, itemId: string, patch: ItemPatch): Promise<void>;
  delete(sessionId: string, restaurantId: string, itemId: string): Promise<void>;
}
