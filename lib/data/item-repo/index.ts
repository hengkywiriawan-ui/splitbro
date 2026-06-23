import type { ItemRepository } from "./types";
import { mockItemRepo } from "./mock-repo";

export function getItemRepo(): ItemRepository {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend === "firebase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./firebase-repo") as { firestoreItemRepo: ItemRepository })
      .firestoreItemRepo;
  }
  return mockItemRepo;
}
