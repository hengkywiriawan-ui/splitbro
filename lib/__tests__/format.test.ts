import { describe, it, expect } from "vitest";
import { formatIDR } from "@/lib/format";

describe("formatIDR", () => {
  it("formats with thousands separators and rupiah prefix", () => {
    expect(formatIDR(1486400)).toBe("Rp 1.486.400");
  });
  it("rounds to the nearest rupiah at display time", () => {
    expect(formatIDR(1486400.4)).toBe("Rp 1.486.400");
    expect(formatIDR(1486400.6)).toBe("Rp 1.486.401");
  });
  it("formats zero", () => {
    expect(formatIDR(0)).toBe("Rp 0");
  });
});
