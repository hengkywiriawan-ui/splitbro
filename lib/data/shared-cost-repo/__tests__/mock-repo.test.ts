import { describe, it, expect, beforeEach } from "vitest";
import { mockSharedCostRepo } from "@/lib/data/shared-cost-repo/mock-repo";

describe("mockSharedCostRepo", () => {
  beforeEach(() => localStorage.clear());

  it("creates a shared cost", async () => {
    const sc = await mockSharedCostRepo.create({ sessionId: "s1", name: "Driver", amount: 50000 });
    expect(sc.costId).toBeTruthy();
    expect(sc.sessionId).toBe("s1");
    expect(sc.name).toBe("Driver");
    expect(sc.amount).toBe(50000);
  });

  it("lists costs scoped to sessionId", async () => {
    await mockSharedCostRepo.create({ sessionId: "s1", name: "A", amount: 10000 });
    await mockSharedCostRepo.create({ sessionId: "s2", name: "B", amount: 20000 });
    const list = await mockSharedCostRepo.list("s1");
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("A");
  });

  it("updates only specified fields", async () => {
    const sc = await mockSharedCostRepo.create({ sessionId: "s1", name: "X", amount: 10000 });
    await mockSharedCostRepo.update("s1", sc.costId, { amount: 20000 });
    const updated = await mockSharedCostRepo.get("s1", sc.costId);
    expect(updated?.amount).toBe(20000);
    expect(updated?.name).toBe("X");
  });

  it("deletes a shared cost", async () => {
    const sc = await mockSharedCostRepo.create({ sessionId: "s1", name: "Gone", amount: 5000 });
    await mockSharedCostRepo.delete("s1", sc.costId);
    expect(await mockSharedCostRepo.get("s1", sc.costId)).toBeNull();
  });

  it("get returns null for unknown id", async () => {
    expect(await mockSharedCostRepo.get("s1", "nope")).toBeNull();
  });
});
