import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HeaderNavLink } from "@/components/HeaderNavLink";

describe("HeaderNavLink", () => {
  it("renders a link to the given href", () => {
    render(
      <HeaderNavLink href="/docs" isActive={false}>
        Docs
      </HeaderNavLink>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("href", "/docs");
  });

  it("calls onNavigate when selected", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <HeaderNavLink href="/docs" isActive={false} onNavigate={onNavigate}>
        Docs
      </HeaderNavLink>,
    );
    await user.click(screen.getByRole("link", { name: "Docs" }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("marks the active link with aria-current, and leaves it off when inactive", () => {
    const { rerender } = render(
      <HeaderNavLink href="/docs" isActive>
        Docs
      </HeaderNavLink>,
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "page");

    rerender(
      <HeaderNavLink href="/docs" isActive={false}>
        Docs
      </HeaderNavLink>,
    );
    expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute("aria-current");
  });
});
