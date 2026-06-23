import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Money } from "@/components/ui/Money";

describe("Money", () => {
  it("formats IDR with mono numeral styling", () => {
    render(<Money amount={1486400} tone="gold" />);

    expect(screen.getByText("Rp 1.486.400")).toHaveClass("font-num");
    expect(screen.getByText("Rp 1.486.400")).toHaveClass("text-gold-dark");
  });
});
