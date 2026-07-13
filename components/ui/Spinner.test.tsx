import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "@/components/ui/Spinner";

describe("Spinner", () => {
  it("hides decorative spinners from assistive technology", () => {
    const { container } = render(<Spinner decorative />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("provides an accessible name in standalone mode", () => {
    render(<Spinner label="Loading dashboard" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading dashboard");
  });
});
