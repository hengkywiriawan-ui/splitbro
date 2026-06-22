import { describe, it, expect } from "vitest";
import { dictionaries } from "@/lib/i18n/dictionaries";

describe("dictionaries", () => {
  it("has matching keys for id and en", () => {
    const idKeys = Object.keys(dictionaries.id).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(idKeys).toEqual(enKeys);
  });
  it("has no empty strings", () => {
    for (const lang of ["id", "en"] as const) {
      for (const [key, value] of Object.entries(dictionaries[lang])) {
        expect(value, `${lang}.${key}`).not.toBe("");
      }
    }
  });
});
