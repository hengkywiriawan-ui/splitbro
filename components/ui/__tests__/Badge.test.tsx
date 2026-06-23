import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders gold tone", () => {
    render(<Badge tone="gold">Premium</Badge>);

    expect(screen.getByText("Premium")).toHaveClass("bg-gold-soft");
  });
});
