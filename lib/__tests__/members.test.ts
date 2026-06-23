import { describe, it, expect } from "vitest";
import { addMember, updateMember, removeMember } from "@/lib/members";
import type { Member } from "@/lib/types";

const base = (): Omit<Member, "memberId"> => ({
  name: "Budi",
  email: null,
  phone: null,
  deposit: 0,
  isDriver: false,
});

describe("addMember", () => {
  it("adds to an empty list and assigns a memberId", () => {
    const result = addMember([], base());
    expect(result).toHaveLength(1);
    expect(result[0].memberId).toBeTruthy();
    expect(result[0].name).toBe("Budi");
  });

  it("adds to an existing list with a different memberId", () => {
    const first = addMember([], { ...base(), name: "A" });
    const second = addMember(first, { ...base(), name: "B" });
    expect(second).toHaveLength(2);
    expect(second[1].name).toBe("B");
    expect(second[0].memberId).not.toBe(second[1].memberId);
  });

  it("does not mutate the original array", () => {
    const original: Member[] = [];
    addMember(original, base());
    expect(original).toHaveLength(0);
  });
});

describe("updateMember", () => {
  it("updates the named member and leaves others unchanged", () => {
    const first = addMember([], { ...base(), name: "A" });
    const second = addMember(first, { ...base(), name: "B" });
    const result = updateMember(second, second[0].memberId, { name: "A2", deposit: 50000 });
    expect(result[0].name).toBe("A2");
    expect(result[0].deposit).toBe(50000);
    expect(result[1].name).toBe("B");
  });

  it("does not change memberId", () => {
    const [m] = addMember([], base());
    const result = updateMember([m], m.memberId, { name: "X" });
    expect(result[0].memberId).toBe(m.memberId);
  });

  it("returns same-shape list if memberId not found", () => {
    const [m] = addMember([], base());
    const result = updateMember([m], "nonexistent", { name: "X" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Budi");
  });

  it("does not mutate the original array", () => {
    const [m] = addMember([], base());
    const original = [m];
    updateMember(original, m.memberId, { name: "X" });
    expect(original[0].name).toBe("Budi");
  });
});

describe("removeMember", () => {
  it("removes the named member", () => {
    const first = addMember([], { ...base(), name: "A" });
    const both = addMember(first, { ...base(), name: "B" });
    const result = removeMember(both, both[0].memberId);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("B");
  });

  it("removes the last member returning an empty array", () => {
    const [m] = addMember([], base());
    expect(removeMember([m], m.memberId)).toHaveLength(0);
  });

  it("does not mutate the original array", () => {
    const [m] = addMember([], base());
    const original = [m];
    removeMember(original, m.memberId);
    expect(original).toHaveLength(1);
  });
});
