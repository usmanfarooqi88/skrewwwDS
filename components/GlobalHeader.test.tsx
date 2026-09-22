import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalHeader } from "@/components/GlobalHeader";

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("GlobalHeader", () => {
  afterEach(() => {
    mockPathname = "/";
  });

  it("renders the locked desktop IA: Logo | Docs | Components | Charts | Agent Kit | Resources", () => {
    render(<GlobalHeader />);
    expect(screen.getByRole("link", { name: "Skrewww home" })).toHaveAttribute("href", "/");

    const nav = screen.getByRole("navigation", { name: "Global" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Docs", "Components", "Charts", "Agent Kit"]);
    expect(within(nav).getByRole("button", { name: "Resources" })).toBeInTheDocument();
  });

  it.each([
    ["/docs", "Docs"],
    ["/foundations", "Docs"],
    ["/components", "Components"],
    ["/components/button", "Components"],
    ["/components/industries/banking", "Components"],
    ["/components/charts", "Charts"],
    ["/components/bar-chart", "Charts"],
    ["/components/line-chart", "Charts"],
    ["/components/area-chart", "Charts"],
    ["/components/chart-card", "Charts"],
    ["/components/chart-metric", "Charts"],
    ["/agent-kit", "Agent Kit"],
  ])("marks only %s as active for the %s item, never Components and Charts together", (pathname, expectedLabel) => {
    mockPathname = pathname;
    render(<GlobalHeader />);
    const nav = screen.getByRole("navigation", { name: "Global" });
    const activeLinks = within(nav)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toHaveTextContent(expectedLabel);
  });

  it("has no active global-nav item on an unrelated route", () => {
    mockPathname = "/guard";
    render(<GlobalHeader />);
    const nav = screen.getByRole("navigation", { name: "Global" });
    const activeLinks = within(nav)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(activeLinks).toHaveLength(0);
    expect(within(nav).getByRole("button", { name: "Resources" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks Resources active on Changelog without activating a top-level link", () => {
    mockPathname = "/changelog";
    render(<GlobalHeader />);
    const nav = screen.getByRole("navigation", { name: "Global" });
    expect(within(nav).getByRole("button", { name: "Resources" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav)
        .getAllByRole("link")
        .filter((link) => link.hasAttribute("aria-current")),
    ).toHaveLength(0);
  });

  it("opens the mobile drawer with only global destinations and resources, then restores focus to the trigger on close", async () => {
    const user = userEvent.setup();
    render(<GlobalHeader />);
    const menuTrigger = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(menuTrigger);

    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    const globalLinksNav = within(dialog).getByRole("navigation", { name: "Global" });
    expect(within(globalLinksNav).getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
    expect(within(globalLinksNav).getByRole("link", { name: "Charts" })).toHaveAttribute(
      "href",
      "/components/charts",
    );
    expect(within(globalLinksNav).getByRole("link", { name: "Guard" })).toHaveAttribute(
      "href",
      "/guard",
    );
    expect(within(globalLinksNav).getByRole("link", { name: "Changelog" })).toHaveAttribute(
      "href",
      "/changelog",
    );
    const github = within(globalLinksNav).getByRole("link", { name: "GitHub" });
    expect(github).toHaveAttribute("target", "_blank");

    expect(within(dialog).queryByRole("link", { name: /^Foundations/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("navigation", { name: /section/i })).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument();
    expect(menuTrigger).toHaveFocus();
  });
});
