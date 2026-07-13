import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("defaults to a div wrapper", () => {
    const { container } = render(<Card>Body</Card>);
    expect(container.firstElementChild?.tagName).toBe("DIV");
  });

  it("supports approved semantic alternatives", () => {
    const { container, rerender } = render(<Card as="article">Article body</Card>);
    expect(container.firstElementChild?.tagName).toBe("ARTICLE");

    rerender(<Card as="section">Section body</Card>);
    expect(container.firstElementChild?.tagName).toBe("SECTION");

    rerender(<Card as="li">List item body</Card>);
    expect(container.firstElementChild?.tagName).toBe("LI");
  });

  it("uses container radius styling hook", () => {
    const { container } = render(<Card>Body</Card>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toMatch(/card_/);
  });

  it("renders optional title with configurable heading level", () => {
    render(
      <Card as="article" title="Billing" headingLevel="h2">
        Content
      </Card>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Billing" })).toBeInTheDocument();
  });
});
