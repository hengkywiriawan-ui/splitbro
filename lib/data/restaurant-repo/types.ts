import type { Restaurant, NewRestaurantInput, RestaurantPatch } from "@/lib/types";

export interface RestaurantRepository {
  list(sessionId: string): Promise<Restaurant[]>;
  get(sessionId: string, restaurantId: string): Promise<Restaurant | null>;
  create(input: NewRestaurantInput): Promise<Restaurant>;
  update(sessionId: string, restaurantId: string, patch: RestaurantPatch): Promise<void>;
  delete(sessionId: string, restaurantId: string): Promise<void>;
}
