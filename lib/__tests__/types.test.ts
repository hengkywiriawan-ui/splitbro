import { describe, it, expect } from "vitest";
import type { Session, User, NewSessionInput, Restaurant, NewRestaurantInput, RestaurantPatch, Item, NewItemInput, ItemPatch, SharedCost, SharedCostPatch } from "@/lib/types";

describe("domain types", () => {
  it("constructs a Session with required fields", () => {
    const session: Session = {
      id: "s1",
      name: "Trip Kediri",
      adminId: "admin1",
      mode: "equal",
      currency: "IDR",
      defaultTaxRate: 11,
      status: "active",
      shareToken: "tok",
      shareExpiresAt: 1,
      paymentInfo: { bankName: null, accountNumber: null, accountName: null, ewallet: null, note: null },
      members: [],
      createdAt: 1,
      updatedAt: 1,
    };
    expect(session.mode).toBe("equal");
  });

  it("constructs a User and NewSessionInput", () => {
    const user: User = { uid: "u1", email: "a@b.c", displayName: "A", photoURL: null };
    const input: NewSessionInput = { name: "X", mode: "item_based", adminId: "u1" };
    expect(user.uid).toBe("u1");
    expect(input.mode).toBe("item_based");
  });
});

describe("Restaurant types", () => {
  it("constructs a Restaurant with all required fields", () => {
    const r: Restaurant = {
      restaurantId: "r1",
      sessionId: "s1",
      name: "Depot Bu Sri",
      date: "2025-06-01",
      order: 0,
      taxIncluded: false,
      taxRate: 11,
      totalAmount: 450000,
    };
    expect(r.restaurantId).toBe("r1");
    expect(r.totalAmount).toBe(450000);
  });

  it("RestaurantPatch allows partial update fields", () => {
    const patch: RestaurantPatch = { name: "New Name", totalAmount: null };
    expect(patch.name).toBe("New Name");
  });
});

describe("Item types", () => {
  it("constructs an Item with all required fields", () => {
    const item: Item = {
      itemId: "i1",
      sessionId: "s1",
      restaurantId: "r1",
      name: "Ayam Goreng",
      price: 25000,
      assignedTo: ["m1", "m2"],
    };
    expect(item.itemId).toBe("i1");
    expect(item.assignedTo).toHaveLength(2);
  });

  it("ItemPatch omits immutable fields", () => {
    const patch: ItemPatch = { name: "Updated", price: 30000, assignedTo: ["m1"] };
    expect(patch.price).toBe(30000);
  });
});

describe("SharedCost types", () => {
  it("constructs a SharedCost with all required fields", () => {
    const sc: SharedCost = { costId: "c1", sessionId: "s1", name: "Driver", amount: 50000 };
    expect(sc.costId).toBe("c1");
    expect(sc.amount).toBe(50000);
  });

  it("SharedCostPatch omits immutable fields", () => {
    const patch: SharedCostPatch = { name: "Parking", amount: 20000 };
    expect(patch.amount).toBe(20000);
  });
});
