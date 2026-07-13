import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("defaults to a non-interactive span", () => {
    render(<Badge variant="neutral">Draft</Badge>);
    const badge = screen.getByText("Draft");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).not.toHaveAttribute("role");
    expect(badge).not.toHaveAttribute("tabindex");
  });

  it("renders visible status text", () => {
    render(
      <Badge variant="warning" showStatusIcon>
        Review
      </Badge>,
    );
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("hides decorative icons from assistive technology", () => {
    const { container } = render(
      <Badge variant="info" showStatusIcon>
        Info
      </Badge>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("does not use automatic live-region roles", () => {
    render(<Badge variant="success">Beta</Badge>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("provides accessible text for abbreviated counts", () => {
    render(<Badge variant="info" count={128} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.getByText("More than 99")).toHaveClass("sr-only");
  });

  it("supports confirmed variants", () => {
    const { rerender } = render(<Badge variant="neutral">Neutral</Badge>);
    expect(screen.getByText("Neutral")).toBeInTheDocument();
    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });
});
