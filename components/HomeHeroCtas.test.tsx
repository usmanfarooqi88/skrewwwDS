import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeHeroCtas } from "@/components/HomeHeroCtas";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
const { trackGAEvent } = vi.hoisted(() => ({ trackGAEvent: vi.fn() }));

vi.mock("@/lib/analytics", () => ({ trackEvent }));
vi.mock("@/lib/ga", () => ({ trackGAEvent }));

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
  trackGAEvent.mockClear();
});

describe("HomeHeroCtas", () => {
  it("fires navigation_cta_clicked with the real label and href for Browse components", async () => {
    const user = userEvent.setup();
    render(<HomeHeroCtas totalComponents={63} />);
    await user.click(screen.getByRole("link", { name: "Browse components" }));
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("navigation_cta_clicked", {
      label: "Browse components",
      href: "/components",
    });
  });

  it("fires navigation_cta_clicked with the real label and href for View foundations", async () => {
    const user = userEvent.setup();
    render(<HomeHeroCtas totalComponents={63} />);
    await user.click(screen.getByRole("link", { name: "View foundations" }));
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("navigation_cta_clicked", {
      label: "View foundations",
      href: "/foundations",
    });
  });

  it("does not prevent default, so modifier-key clicks (open in new tab) keep working", () => {
    render(<HomeHeroCtas totalComponents={63} />);
    const link = screen.getByRole("link", { name: "Browse components" });
    const notPrevented = fireEvent.click(link, { metaKey: true });
    expect(notPrevented).toBe(true);
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("navigation_cta_clicked", {
      label: "Browse components",
      href: "/components",
    });
  });

  it("keeps real hrefs on both links so navigation is unaffected by tracking", () => {
    render(<HomeHeroCtas totalComponents={63} />);
    expect(screen.getByRole("link", { name: "Browse components" })).toHaveAttribute(
      "href",
      "/components",
    );
    expect(screen.getByRole("link", { name: "View foundations" })).toHaveAttribute(
      "href",
      "/foundations",
    );
  });

  it("fires navigation_cta_clicked with the full external URL for Get free Figma file", async () => {
    const user = userEvent.setup();
    render(<HomeHeroCtas totalComponents={63} />);
    await user.click(screen.getByRole("link", { name: "Get free Figma file" }));
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("navigation_cta_clicked", {
      label: "Get free Figma file",
      href: "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
    });
  });

  it("fires navigation_cta_clicked with the full external URL for Get Skrewww Pro", async () => {
    const user = userEvent.setup();
    render(<HomeHeroCtas totalComponents={63} />);
    await user.click(screen.getByRole("link", { name: "Get Skrewww Pro" }));
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("navigation_cta_clicked", {
      label: "Get Skrewww Pro",
      href: "https://usmanfarooqi.gumroad.com/l/skrewww-pro",
    });
  });

  it("fires the named GA4 free_figma_click event exactly once for Get free Figma file", async () => {
    const user = userEvent.setup();
    render(<HomeHeroCtas totalComponents={63} />);
    await user.click(screen.getByRole("link", { name: "Get free Figma file" }));
    expect(trackGAEvent).toHaveBeenCalledExactlyOnceWith("free_figma_click", {
      cta_location: "home_hero",
      destination: "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
    });
  });

  it("fires the named GA4 pro_gumroad_click event exactly once for Get Skrewww Pro", async () => {
    const user = userEvent.setup();
    render(<HomeHeroCtas totalComponents={63} />);
    await user.click(screen.getByRole("link", { name: "Get Skrewww Pro" }));
    expect(trackGAEvent).toHaveBeenCalledExactlyOnceWith("pro_gumroad_click", {
      cta_location: "home_hero",
      destination: "https://usmanfarooqi.gumroad.com/l/skrewww-pro",
    });
  });

  it("does not fire a named GA4 event for the internal Browse components / View foundations CTAs", async () => {
    const user = userEvent.setup();
    render(<HomeHeroCtas totalComponents={63} />);
    await user.click(screen.getByRole("link", { name: "Browse components" }));
    await user.click(screen.getByRole("link", { name: "View foundations" }));
    expect(trackGAEvent).not.toHaveBeenCalled();
  });

  it("opens the Figma and Gumroad links in a new tab with a safe rel", () => {
    render(<HomeHeroCtas totalComponents={63} />);
    const figmaLink = screen.getByRole("link", { name: "Get free Figma file" });
    const gumroadLink = screen.getByRole("link", { name: "Get Skrewww Pro" });

    expect(figmaLink).toHaveAttribute(
      "href",
      "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
    );
    expect(figmaLink).toHaveAttribute("target", "_blank");
    expect(figmaLink).toHaveAttribute("rel", "noopener noreferrer");

    expect(gumroadLink).toHaveAttribute("href", "https://usmanfarooqi.gumroad.com/l/skrewww-pro");
    expect(gumroadLink).toHaveAttribute("target", "_blank");
    expect(gumroadLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows a caption reflecting the real total component count passed in", () => {
    render(<HomeHeroCtas totalComponents={63} />);
    expect(screen.getByText(/63 in Pro/)).toBeInTheDocument();
  });

  it("groups Get free Figma file and Get Skrewww Pro in their own row, separate from Browse/View", () => {
    render(<HomeHeroCtas totalComponents={63} />);
    const figmaLink = screen.getByRole("link", { name: "Get free Figma file" });
    const gumroadLink = screen.getByRole("link", { name: "Get Skrewww Pro" });
    const browseLink = screen.getByRole("link", { name: "Browse components" });

    expect(figmaLink.parentElement).toBe(gumroadLink.parentElement);
    expect(figmaLink.parentElement).not.toBe(browseLink.parentElement);
  });
});
