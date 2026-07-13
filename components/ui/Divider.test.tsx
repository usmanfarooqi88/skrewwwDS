import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Divider } from "@/components/ui/Divider";

describe("Divider", () => {
  it("renders native hr in thematic mode", () => {
    const { container } = render(<Divider />);
    expect(container.querySelector("hr")).toBeTruthy();
  });

  it("hides decorative dividers from assistive technology", () => {
    const { container } = render(<Divider variant="decorative" />);
    const divider = container.firstElementChild;
    expect(divider?.tagName).toBe("DIV");
    expect(divider).toHaveAttribute("aria-hidden", "true");
    expect(divider).toHaveAttribute("role", "presentation");
  });

  it("exposes structural vertical separators with orientation", () => {
    render(<Divider orientation="vertical" variant="structural" />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });

  it("does not add invalid ARIA to thematic horizontal dividers", () => {
    const { container } = render(<Divider />);
    const hr = container.querySelector("hr");
    expect(hr).not.toHaveAttribute("role");
    expect(hr).not.toHaveAttribute("aria-hidden");
  });

  it("does not use separator role for decorative vertical dividers", () => {
    const { container } = render(<Divider orientation="vertical" variant="decorative" />);
    const divider = container.firstElementChild;
    expect(divider).toHaveAttribute("aria-hidden", "true");
    expect(divider).not.toHaveAttribute("role", "separator");
  });
});
