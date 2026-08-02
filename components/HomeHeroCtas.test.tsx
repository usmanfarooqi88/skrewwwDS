import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeHeroCtas } from "@/components/HomeHeroCtas";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock("@/lib/analytics", () => ({ trackEvent }));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  trackEvent.mockClear();
});

describe("HomeHeroCtas", () => {
  it("fires navigation_cta_clicked with the real label and href for Browse components", async () => {
    const user = userEvent.setup();
    render(<HomeHeroCtas />);
    await user.click(screen.getByRole("link", { name: "Browse components" }));
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("navigation_cta_clicked", {
      label: "Browse components",
      href: "/components",
    });
  });

  it("fires navigation_cta_clicked with the real label and href for View foundations", async () => {
    const user = userEvent.setup();
    render(<HomeHeroCtas />);
    await user.click(screen.getByRole("link", { name: "View foundations" }));
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("navigation_cta_clicked", {
      label: "View foundations",
      href: "/foundations",
    });
  });

  it("does not prevent default, so modifier-key clicks (open in new tab) keep working", () => {
    render(<HomeHeroCtas />);
    const link = screen.getByRole("link", { name: "Browse components" });
    const notPrevented = fireEvent.click(link, { metaKey: true });
    expect(notPrevented).toBe(true);
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("navigation_cta_clicked", {
      label: "Browse components",
      href: "/components",
    });
  });

  it("keeps real hrefs on both links so navigation is unaffected by tracking", () => {
    render(<HomeHeroCtas />);
    expect(screen.getByRole("link", { name: "Browse components" })).toHaveAttribute(
      "href",
      "/components",
    );
    expect(screen.getByRole("link", { name: "View foundations" })).toHaveAttribute(
      "href",
      "/foundations",
    );
  });
});
