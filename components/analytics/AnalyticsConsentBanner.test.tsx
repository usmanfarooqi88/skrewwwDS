import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";
import { useAnalyticsConsent } from "@/components/analytics/AnalyticsConsentProvider";

vi.mock("@/components/analytics/AnalyticsConsentProvider", () => ({
  useAnalyticsConsent: vi.fn(),
}));

const mockedUseAnalyticsConsent = vi.mocked(useAnalyticsConsent);

describe("AnalyticsConsentBanner", () => {
  it("renders nothing when showBanner is false", () => {
    mockedUseAnalyticsConsent.mockReturnValue({
      hasGA: true,
      state: "granted",
      showBanner: false,
      allow: vi.fn(),
      decline: vi.fn(),
      reopen: vi.fn(),
    });
    const { container } = render(<AnalyticsConsentBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the title, body copy, and both actions as a non-modal region when showBanner is true", () => {
    mockedUseAnalyticsConsent.mockReturnValue({
      hasGA: true,
      state: "undecided",
      showBanner: true,
      allow: vi.fn(),
      decline: vi.fn(),
      reopen: vi.fn(),
    });
    render(<AnalyticsConsentBanner />);

    const region = screen.getByRole("region", { name: "Analytics preferences" });
    expect(region).toBeInTheDocument();
    expect(region).not.toHaveAttribute("aria-modal");
    expect(region).not.toHaveAttribute("role", "dialog");

    expect(screen.getByText("Analytics preferences")).toBeInTheDocument();
    expect(
      screen.getByText(/We use Google Analytics to understand how Skrewww is used/),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Allow analytics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
  });

  it("calls allow() when Allow analytics is clicked", async () => {
    const allow = vi.fn();
    mockedUseAnalyticsConsent.mockReturnValue({
      hasGA: true,
      state: "undecided",
      showBanner: true,
      allow,
      decline: vi.fn(),
      reopen: vi.fn(),
    });
    const user = userEvent.setup();
    render(<AnalyticsConsentBanner />);
    await user.click(screen.getByRole("button", { name: "Allow analytics" }));
    expect(allow).toHaveBeenCalledOnce();
  });

  it("calls decline() when Decline is clicked", async () => {
    const decline = vi.fn();
    mockedUseAnalyticsConsent.mockReturnValue({
      hasGA: true,
      state: "undecided",
      showBanner: true,
      allow: vi.fn(),
      decline,
      reopen: vi.fn(),
    });
    const user = userEvent.setup();
    render(<AnalyticsConsentBanner />);
    await user.click(screen.getByRole("button", { name: "Decline" }));
    expect(decline).toHaveBeenCalledOnce();
  });

  it("both actions are reachable and operable by keyboard alone", async () => {
    const allow = vi.fn();
    const decline = vi.fn();
    mockedUseAnalyticsConsent.mockReturnValue({
      hasGA: true,
      state: "undecided",
      showBanner: true,
      allow,
      decline,
      reopen: vi.fn(),
    });
    const user = userEvent.setup();
    render(<AnalyticsConsentBanner />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Decline" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(decline).toHaveBeenCalledOnce();

    await user.tab();
    expect(screen.getByRole("button", { name: "Allow analytics" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(allow).toHaveBeenCalledOnce();
  });
});
