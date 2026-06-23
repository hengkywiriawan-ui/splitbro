import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/ui/PageHeader";

describe("PageHeader", () => {
  it("renders title, back link, and action", () => {
    render(<PageHeader title="Members" backHref="/sessions" action={<button type="button">Save</button>} />);

    expect(screen.getByRole("heading", { name: "Members" })).toBeInTheDocument();
    expect(screen.getByLabelText("Back")).toHaveAttribute("href", "/sessions");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
