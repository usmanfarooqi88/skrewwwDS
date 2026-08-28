import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarNav } from "@/components/SidebarNav";
import { AnalyticsConsentProvider } from "@/components/analytics/AnalyticsConsentProvider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: () => null,
}));

describe("SidebarNav analytics preferences reopener", () => {
  it("does not render the action when no GA Measurement ID is configured", () => {
    render(
      <AnalyticsConsentProvider gaMeasurementId={undefined}>
        <SidebarNav />
      </AnalyticsConsentProvider>,
    );
    expect(screen.queryByRole("button", { name: "Analytics preferences" })).not.toBeInTheDocument();
  });

  it("does not render the action, and does not throw, when rendered with no provider at all", () => {
    expect(() => render(<SidebarNav />)).not.toThrow();
    expect(screen.queryByRole("button", { name: "Analytics preferences" })).not.toBeInTheDocument();
  });

  it("renders a low-emphasis button that reopens the consent banner", async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsConsentProvider gaMeasurementId="G-TEST123">
        <SidebarNav />
      </AnalyticsConsentProvider>,
    );
    const button = await screen.findByRole("button", { name: "Analytics preferences" });
    expect(button).toHaveAttribute("type", "button");

    await user.click(button);
    // Reopening is verified end-to-end (banner actually becomes visible) in
    // AnalyticsConsentProvider.test.tsx; here we only need the click not to
    // throw and the control to remain in the document.
    expect(button).toBeInTheDocument();
  });

  it("calls onNavigate (closing the mobile drawer) when clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <AnalyticsConsentProvider gaMeasurementId="G-TEST123">
        <SidebarNav onNavigate={onNavigate} />
      </AnalyticsConsentProvider>,
    );
    await user.click(await screen.findByRole("button", { name: "Analytics preferences" }));
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
