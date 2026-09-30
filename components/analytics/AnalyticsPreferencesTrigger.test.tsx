import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";
import { AnalyticsConsentProvider } from "@/components/analytics/AnalyticsConsentProvider";
import { AnalyticsPreferencesTrigger } from "@/components/analytics/AnalyticsPreferencesTrigger";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/consent";

vi.mock("@next/third-parties/google", () => ({ GoogleAnalytics: () => null }));

function renderWithProvider(stored: "granted" | "denied" | null, gaMeasurementId = "G-TEST") {
  window.localStorage.clear();
  if (stored) window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, stored);
  return render(
    <AnalyticsConsentProvider gaMeasurementId={gaMeasurementId}>
      <AnalyticsPreferencesTrigger />
      <AnalyticsConsentBanner />
    </AnalyticsConsentProvider>,
  );
}

const region = () => screen.queryByRole("region", { name: "Analytics preferences" });

describe("AnalyticsPreferencesTrigger", () => {
  it("renders nothing when Google Analytics is not configured", () => {
    const { container } = renderWithProvider(null, "");
    expect(container).toBeEmptyDOMElement();
  });

  it("is a semantic button named 'Analytics preferences'", async () => {
    renderWithProvider("granted");
    const trigger = await screen.findByRole("button", { name: "Analytics preferences" });
    expect(trigger).toHaveAttribute("type", "button");
  });

  it("does not change consent or open the banner until activated", async () => {
    renderWithProvider("granted");
    await screen.findByRole("button", { name: "Analytics preferences" });
    expect(region()).toBeNull();
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");
  });

  it.each([
    ["granted", "analytics allowed"],
    ["denied", "analytics declined"],
  ] as const)("%s visitor: reopens one banner that reflects the current choice", async (stored, text) => {
    const user = userEvent.setup();
    renderWithProvider(stored);
    await user.click(await screen.findByRole("button", { name: "Analytics preferences" }));

    expect(screen.getAllByRole("region", { name: "Analytics preferences" })).toHaveLength(1);
    expect(screen.getByText(new RegExp(`Current choice: ${text}`))).toBeInTheDocument();
    // Reopening alone never rewrites the stored choice.
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe(stored);
  });

  it("is activatable from the keyboard (Enter and Space)", async () => {
    const user = userEvent.setup();
    renderWithProvider("denied");
    const trigger = await screen.findByRole("button", { name: "Analytics preferences" });

    trigger.focus();
    await user.keyboard("{Enter}");
    expect(region()).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Decline" }));
    expect(region()).toBeNull();

    trigger.focus();
    await user.keyboard(" ");
    expect(region()).not.toBeNull();
  });

  it("does not show a 'current choice' line to a first-time visitor", async () => {
    renderWithProvider(null);
    expect(await screen.findByRole("region", { name: "Analytics preferences" })).toBeInTheDocument();
    expect(screen.queryByText(/Current choice/)).toBeNull();
  });
});
