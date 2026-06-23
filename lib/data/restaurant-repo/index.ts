import type { RestaurantRepository } from "./types";
import { mockRestaurantRepo } from "./mock-repo";

export function getRestaurantRepo(): RestaurantRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./firebase-repo") as { firestoreRestaurantRepo: RestaurantRepository })
      .firestoreRestaurantRepo;
  }
  return mockRestaurantRepo;
}
