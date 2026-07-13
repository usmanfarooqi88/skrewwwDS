import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Link } from "@/components/ui/Link";

describe("Link", () => {
  it("renders a semantic anchor for internal links", () => {
    render(<Link href="/components/button">Button docs</Link>);
    const link = screen.getByRole("link", { name: "Button docs" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/components/button");
  });

  it("applies safe rel for external blank targets", () => {
    render(
      <Link href="https://example.com" target="_blank">
        External
      </Link>,
    );
    const link = screen.getByRole("link", { name: "External" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("hides decorative icons from assistive technology", () => {
    const { container } = render(
      <Link href="/components" trailingIcon={<span data-testid="icon">↗</span>}>
        Docs
      </Link>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("does not assign role=link to native anchors", () => {
    render(<Link href="/components">Docs</Link>);
    expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute("role", "link");
  });
});
