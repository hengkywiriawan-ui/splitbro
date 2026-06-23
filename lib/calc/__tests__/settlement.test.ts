import { describe, it, expect } from "vitest";
import { computeSettlement } from "@/lib/calc/settlement";
import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";

function makeSession(
  mode: "equal" | "item_based",
  members: { memberId: string; name: string; deposit?: number; isDriver?: boolean }[]
): Session {
  return {
    id: "s1",
    name: "Test Trip",
    adminId: "admin1",
    mode,
    currency: "IDR",
    defaultTaxRate: 11,
    status: "active",
    shareToken: "tok",
    shareExpiresAt: 0,
    paymentInfo: { bankName: null, accountNumber: null, accountName: null, ewallet: null, note: null },
    members: members.map((m) => ({
      memberId: m.memberId,
      name: m.name,
      email: null,
      phone: null,
      deposit: m.deposit ?? 0,
      isDriver: m.isDriver ?? false,
    })),
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    restaurantId: "r1",
    sessionId: "s1",
    name: "Resto",
    date: null,
    order: 0,
    taxIncluded: false,
    taxRate: 11,
    totalAmount: null,
    ...overrides,
  };
}

describe("computeSettlement — equal mode", () => {
  it("splits total evenly, tax excluded", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: false, taxRate: 11, totalAmount: 100000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    // effectiveTotal = 100000 * 1.11 = 111000; per member = 55500
    expect(breakdown[0].consumption).toBe(55500);
    expect(breakdown[1].consumption).toBe(55500);
  });

  it("splits total evenly, tax included (multiplier = 1)", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 111000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    // effectiveTotal = 111000 (no change); per member = 55500
    expect(breakdown[0].consumption).toBe(55500);
    expect(breakdown[1].consumption).toBe(55500);
  });

  it("grandTotal equals sum of all totalTagihan", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 200000 });
    const { breakdown, grandTotal } = computeSettlement(session, [restaurant], {}, []);
    const summed = breakdown.reduce((a, b) => a + b.totalTagihan, 0);
    expect(grandTotal).toBeCloseTo(summed, 5);
  });
});

describe("computeSettlement — item_based mode", () => {
  it("single-assign: full price goes to that member", () => {
    const session = makeSession("item_based", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true });
    const items: Item[] = [
      { itemId: "i1", sessionId: "s1", restaurantId: "r1", name: "A", price: 30000, assignedTo: ["m1"] },
      { itemId: "i2", sessionId: "s1", restaurantId: "r1", name: "B", price: 20000, assignedTo: ["m2"] },
    ];
    const { breakdown } = computeSettlement(session, [restaurant], { r1: items }, []);
    expect(breakdown.find((b) => b.memberId === "m1")?.consumption).toBe(30000);
    expect(breakdown.find((b) => b.memberId === "m2")?.consumption).toBe(20000);
  });

  it("multi-assign: price split evenly among assigned members", () => {
    const session = makeSession("item_based", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
      { memberId: "m3", name: "Carol" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true });
    const items: Item[] = [
      { itemId: "i1", sessionId: "s1", restaurantId: "r1", name: "Shared", price: 60000, assignedTo: ["m1", "m2"] },
    ];
    const { breakdown } = computeSettlement(session, [restaurant], { r1: items }, []);
    expect(breakdown.find((b) => b.memberId === "m1")?.consumption).toBe(30000);
    expect(breakdown.find((b) => b.memberId === "m2")?.consumption).toBe(30000);
    expect(breakdown.find((b) => b.memberId === "m3")?.consumption).toBe(0);
  });

  it("proportional tax: heavier orderer carries more PPN", () => {
    const session = makeSession("item_based", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: false, taxRate: 10 });
    const items: Item[] = [
      { itemId: "i1", sessionId: "s1", restaurantId: "r1", name: "A", price: 100000, assignedTo: ["m1"] },
      { itemId: "i2", sessionId: "s1", restaurantId: "r1", name: "B", price: 50000, assignedTo: ["m2"] },
    ];
    // subtotal = 150000; effectiveTotal = 165000; taxMultiplier = 1.1
    // m1 raw = 100000 → 110000; m2 raw = 50000 → 55000
    const { breakdown } = computeSettlement(session, [restaurant], { r1: items }, []);
    expect(breakdown.find((b) => b.memberId === "m1")?.consumption).toBeCloseTo(110000, 5);
    expect(breakdown.find((b) => b.memberId === "m2")?.consumption).toBeCloseTo(55000, 5);
  });
});

describe("computeSettlement — shared costs", () => {
  it("divides shared cost evenly across all members", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice" },
      { memberId: "m2", name: "Bob" },
    ]);
    const sharedCosts: SharedCost[] = [
      { costId: "c1", sessionId: "s1", name: "Driver", amount: 20000 },
    ];
    const { breakdown } = computeSettlement(session, [], {}, sharedCosts);
    expect(breakdown[0].sharedShare).toBe(10000);
    expect(breakdown[1].sharedShare).toBe(10000);
  });
});

describe("computeSettlement — deposit / settlement", () => {
  it("netDue > 0 when member underpays", () => {
    const session = makeSession("equal", [{ memberId: "m1", name: "Alice", deposit: 50000 }]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 100000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    // totalTagihan = 100000; deposit = 50000; netDue = 50000
    expect(breakdown[0].netDue).toBe(50000);
  });

  it("netDue < 0 when member overpays", () => {
    const session = makeSession("equal", [{ memberId: "m1", name: "Alice", deposit: 120000 }]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 100000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    expect(breakdown[0].netDue).toBe(-20000);
  });

  it("netDue = 0 when member pays exactly", () => {
    const session = makeSession("equal", [{ memberId: "m1", name: "Alice", deposit: 100000 }]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 100000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    expect(breakdown[0].netDue).toBe(0);
  });

  it("totalDeposit equals sum of all deposits", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Alice", deposit: 50000 },
      { memberId: "m2", name: "Bob", deposit: 75000 },
    ]);
    const { totalDeposit } = computeSettlement(session, [], {}, []);
    expect(totalDeposit).toBe(125000);
  });
});

describe("computeSettlement — driver flag", () => {
  it("splits a driver's consumption evenly among non-drivers (equal mode)", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Driver", isDriver: true },
      { memberId: "m2", name: "Bob" },
      { memberId: "m3", name: "Carol" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 90000 });
    const { breakdown, grandTotal } = computeSettlement(session, [restaurant], {}, []);
    // each raw = 30000; driver's 30000 split to 2 non-drivers → +15000 each
    expect(breakdown.find((b) => b.memberId === "m1")?.consumption).toBe(0);
    expect(breakdown.find((b) => b.memberId === "m2")?.consumption).toBe(45000);
    expect(breakdown.find((b) => b.memberId === "m3")?.consumption).toBe(45000);
    expect(grandTotal).toBe(90000); // money is conserved
  });

  it("redistributes a driver's item consumption to non-drivers (item mode)", () => {
    const session = makeSession("item_based", [
      { memberId: "m1", name: "Driver", isDriver: true },
      { memberId: "m2", name: "Bob" },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true });
    const items: Item[] = [
      { itemId: "i1", sessionId: "s1", restaurantId: "r1", name: "A", price: 40000, assignedTo: ["m1"] },
      { itemId: "i2", sessionId: "s1", restaurantId: "r1", name: "B", price: 20000, assignedTo: ["m2"] },
    ];
    const { breakdown } = computeSettlement(session, [restaurant], { r1: items }, []);
    expect(breakdown.find((b) => b.memberId === "m1")?.consumption).toBe(0);
    expect(breakdown.find((b) => b.memberId === "m2")?.consumption).toBe(60000);
  });

  it("does not redistribute when every member is a driver", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "D1", isDriver: true },
      { memberId: "m2", name: "D2", isDriver: true },
    ]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: 100000 });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    expect(breakdown.find((b) => b.memberId === "m1")?.consumption).toBe(50000);
    expect(breakdown.find((b) => b.memberId === "m2")?.consumption).toBe(50000);
  });

  it("driver still shares shared costs evenly", () => {
    const session = makeSession("equal", [
      { memberId: "m1", name: "Driver", isDriver: true },
      { memberId: "m2", name: "Bob" },
    ]);
    const sharedCosts: SharedCost[] = [
      { costId: "c1", sessionId: "s1", name: "Parkir", amount: 20000 },
    ];
    const { breakdown } = computeSettlement(session, [], {}, sharedCosts);
    expect(breakdown.find((b) => b.memberId === "m1")?.sharedShare).toBe(10000);
    expect(breakdown.find((b) => b.memberId === "m1")?.netDue).toBe(10000);
  });
});

describe("computeSettlement — edge cases", () => {
  it("returns empty breakdown for session with no members", () => {
    const session = makeSession("equal", []);
    const { breakdown, grandTotal, totalDeposit } = computeSettlement(session, [], {}, []);
    expect(breakdown).toHaveLength(0);
    expect(grandTotal).toBe(0);
    expect(totalDeposit).toBe(0);
  });

  it("skips restaurant with null totalAmount in equal mode", () => {
    const session = makeSession("equal", [{ memberId: "m1", name: "Alice" }]);
    const restaurant = makeRestaurant({ taxIncluded: true, totalAmount: null });
    const { breakdown } = computeSettlement(session, [restaurant], {}, []);
    expect(breakdown[0].consumption).toBe(0);
  });
});
