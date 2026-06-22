import { describe, it, expect } from "vitest";
import type { Session, User, NewSessionInput } from "@/lib/types";

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
