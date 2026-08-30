import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";
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

  it("composes arbitrary body children and footer actions", () => {
    render(
      <Card
        title="Billing"
        footer={
          <>
            <Button size="sm">Cancel</Button>
            <Button size="sm">Save</Button>
          </>
        }
      >
        <div data-testid="custom-card-content">
          <p>Custom content</p>
          <Button>Action</Button>
        </div>
      </Card>,
    );

    expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
    expect(screen.getAllByTestId("custom-card-content")).toHaveLength(1);
    const content = screen.getByTestId("custom-card-content");
    expect(content).toHaveTextContent("Custom content");
    expect(within(content).getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.queryByText(/add content/i)).not.toBeInTheDocument();
  });

  it("does not inject instructional placeholder when children and footer are omitted", () => {
    render(<Card title="Empty body" />);
    expect(screen.getByRole("heading", { name: "Empty body" })).toBeInTheDocument();
    expect(screen.queryByText(/add content/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/drop content/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/content slot/i)).not.toBeInTheDocument();
  });
});
