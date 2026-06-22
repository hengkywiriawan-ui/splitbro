import { describe, it, expect, beforeEach } from "vitest";
import { mockRestaurantRepo } from "@/lib/data/restaurant-repo/mock-repo";

describe("mockRestaurantRepo", () => {
  beforeEach(() => localStorage.clear());

  it("creates a restaurant with defaults", async () => {
    const r = await mockRestaurantRepo.create({
      sessionId: "s1",
      name: "Depot Bu Sri",
    });
    expect(r.restaurantId).toBeTruthy();
    expect(r.sessionId).toBe("s1");
    expect(r.taxIncluded).toBe(false);
    expect(r.taxRate).toBe(11);
    expect(r.totalAmount).toBeNull();
    expect(r.date).toBeNull();
    expect(r.order).toBe(0);
  });

  it("honors explicit fields on create", async () => {
    const r = await mockRestaurantRepo.create({
      sessionId: "s1",
      name: "X",
      taxIncluded: true,
      taxRate: 10,
      totalAmount: 500000,
      date: "2025-06-01",
      order: 2,
    });
    expect(r.taxIncluded).toBe(true);
    expect(r.taxRate).toBe(10);
    expect(r.totalAmount).toBe(500000);
    expect(r.date).toBe("2025-06-01");
    expect(r.order).toBe(2);
  });

  it("lists restaurants sorted by order, scoped to sessionId", async () => {
    await mockRestaurantRepo.create({ sessionId: "s1", name: "A", order: 1 });
    await mockRestaurantRepo.create({ sessionId: "s1", name: "B", order: 0 });
    await mockRestaurantRepo.create({ sessionId: "s2", name: "Other", order: 0 });
    const list = await mockRestaurantRepo.list("s1");
    expect(list.map((r) => r.name)).toEqual(["B", "A"]);
  });

  it("append-order defaults to current list length", async () => {
    await mockRestaurantRepo.create({ sessionId: "s1", name: "A" });
    const b = await mockRestaurantRepo.create({ sessionId: "s1", name: "B" });
    expect(b.order).toBe(1);
  });

  it("updates only specified fields", async () => {
    const r = await mockRestaurantRepo.create({ sessionId: "s1", name: "X" });
    await mockRestaurantRepo.update("s1", r.restaurantId, { name: "Y", totalAmount: 300000 });
    const updated = await mockRestaurantRepo.get("s1", r.restaurantId);
    expect(updated?.name).toBe("Y");
    expect(updated?.totalAmount).toBe(300000);
    expect(updated?.restaurantId).toBe(r.restaurantId);
  });

  it("deletes a restaurant", async () => {
    const r = await mockRestaurantRepo.create({ sessionId: "s1", name: "Gone" });
    await mockRestaurantRepo.delete("s1", r.restaurantId);
    expect(await mockRestaurantRepo.get("s1", r.restaurantId)).toBeNull();
  });

  it("get returns null for unknown id", async () => {
    expect(await mockRestaurantRepo.get("s1", "nope")).toBeNull();
  });
});
