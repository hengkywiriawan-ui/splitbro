import { describe, it, expect, beforeEach } from "vitest";
import { mockRepo } from "@/lib/data/mock-repo";
import type { SessionPatch } from "@/lib/types";

describe("mockRepo", () => {
  beforeEach(() => localStorage.clear());

  it("creates a session with defaults and a unique share token", async () => {
    const a = await mockRepo.create({ name: "Trip A", mode: "equal", adminId: "admin1" });
    const b = await mockRepo.create({ name: "Trip B", mode: "item_based", adminId: "admin1" });
    expect(a.defaultTaxRate).toBe(11);
    expect(a.status).toBe("active");
    expect(a.currency).toBe("IDR");
    expect(a.members).toEqual([]);
    expect(a.shareToken).toBeTruthy();
    expect(a.shareToken).not.toBe(b.shareToken);
    expect(a.id).not.toBe(b.id);
  });

  it("honors an explicit defaultTaxRate", async () => {
    const s = await mockRepo.create({ name: "X", mode: "equal", adminId: "admin1", defaultTaxRate: 10 });
    expect(s.defaultTaxRate).toBe(10);
  });

  it("lists only sessions for the given admin, newest first", async () => {
    await mockRepo.create({ name: "A1", mode: "equal", adminId: "admin1" });
    await mockRepo.create({ name: "A2", mode: "equal", adminId: "admin1" });
    await mockRepo.create({ name: "B1", mode: "equal", adminId: "admin2" });
    const mine = await mockRepo.listByAdmin("admin1");
    expect(mine.map((s) => s.name)).toEqual(["A2", "A1"]);
  });

  it("updates the name and status but never the mode", async () => {
    const s = await mockRepo.create({ name: "Old", mode: "equal", adminId: "admin1" });
    // deliberately passes an out-of-contract field to verify defensive stripping
    await mockRepo.update(s.id, { name: "New", status: "closed", mode: "item_based" } as unknown as SessionPatch);
    const updated = await mockRepo.get(s.id);
    expect(updated?.name).toBe("New");
    expect(updated?.status).toBe("closed");
    expect(updated?.mode).toBe("equal");
  });

  it("deletes a session", async () => {
    const s = await mockRepo.create({ name: "Gone", mode: "equal", adminId: "admin1" });
    await mockRepo.delete(s.id);
    expect(await mockRepo.get(s.id)).toBeNull();
  });
});
