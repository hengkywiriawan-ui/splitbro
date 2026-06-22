import { describe, it, expect, beforeEach } from "vitest";
import { mockItemRepo } from "@/lib/data/item-repo/mock-repo";

describe("mockItemRepo", () => {
  beforeEach(() => localStorage.clear());

  it("creates an item with all fields", async () => {
    const item = await mockItemRepo.create({
      sessionId: "s1",
      restaurantId: "r1",
      name: "Ayam Goreng",
      price: 25000,
      assignedTo: ["m1"],
    });
    expect(item.itemId).toBeTruthy();
    expect(item.sessionId).toBe("s1");
    expect(item.restaurantId).toBe("r1");
    expect(item.name).toBe("Ayam Goreng");
    expect(item.price).toBe(25000);
    expect(item.assignedTo).toEqual(["m1"]);
  });

  it("lists items scoped to sessionId+restaurantId", async () => {
    await mockItemRepo.create({ sessionId: "s1", restaurantId: "r1", name: "A", price: 10000, assignedTo: ["m1"] });
    await mockItemRepo.create({ sessionId: "s1", restaurantId: "r2", name: "B", price: 20000, assignedTo: ["m1"] });
    await mockItemRepo.create({ sessionId: "s2", restaurantId: "r1", name: "C", price: 30000, assignedTo: ["m1"] });
    const list = await mockItemRepo.list("s1", "r1");
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("A");
  });

  it("updates only specified fields", async () => {
    const item = await mockItemRepo.create({
      sessionId: "s1", restaurantId: "r1", name: "X", price: 10000, assignedTo: ["m1"],
    });
    await mockItemRepo.update("s1", "r1", item.itemId, { name: "Y", price: 20000 });
    const updated = await mockItemRepo.get("s1", "r1", item.itemId);
    expect(updated?.name).toBe("Y");
    expect(updated?.price).toBe(20000);
    expect(updated?.assignedTo).toEqual(["m1"]);
  });

  it("deletes an item", async () => {
    const item = await mockItemRepo.create({
      sessionId: "s1", restaurantId: "r1", name: "Gone", price: 5000, assignedTo: ["m1"],
    });
    await mockItemRepo.delete("s1", "r1", item.itemId);
    expect(await mockItemRepo.get("s1", "r1", item.itemId)).toBeNull();
  });

  it("get returns null for unknown id", async () => {
    expect(await mockItemRepo.get("s1", "r1", "nope")).toBeNull();
  });
});
