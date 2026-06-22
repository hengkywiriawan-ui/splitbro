import { describe, it, expect } from "vitest";
import type { Session, User, NewSessionInput, Restaurant, NewRestaurantInput, RestaurantPatch } from "@/lib/types";

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
