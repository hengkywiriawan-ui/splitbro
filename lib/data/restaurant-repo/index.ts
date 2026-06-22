import type { RestaurantRepository } from "./types";
import { mockRestaurantRepo } from "./mock-repo";

export function getRestaurantRepo(): RestaurantRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase restaurant backend not yet implemented");
  }
  return mockRestaurantRepo;
}
