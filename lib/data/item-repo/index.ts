import type { ItemRepository } from "./types";
import { mockItemRepo } from "./mock-repo";

export function getItemRepo(): ItemRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    throw new Error("Firebase item backend not yet implemented");
  }
  return mockItemRepo;
}
