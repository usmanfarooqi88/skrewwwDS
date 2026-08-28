import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AnalyticsConsentProvider,
  useAnalyticsConsent,
} from "@/components/analytics/AnalyticsConsentProvider";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/consent";

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => (
    <div data-testid="google-analytics" data-ga-id={gaId} />
  ),
}));

function Harness() {
  const { hasGA, state, showBanner, allow, decline, reopen } = useAnalyticsConsent();
  return (
    <div>
      <p data-testid="has-ga">{String(hasGA)}</p>
      <p data-testid="state">{state}</p>
      <p data-testid="show-banner">{String(showBanner)}</p>
      <button onClick={allow}>allow</button>
      <button onClick={decline}>decline</button>
      <button onClick={reopen}>reopen</button>
    </div>
  );
}

function renderWithProvider(gaMeasurementId?: string) {
  return render(
    <AnalyticsConsentProvider gaMeasurementId={gaMeasurementId}>
      <Harness />
    </AnalyticsConsentProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("AnalyticsConsentProvider", () => {
  it("stays inert when no GA Measurement ID is configured — no banner, no GA, ever", async () => {
    renderWithProvider(undefined);
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("loading"));
    expect(screen.getByTestId("has-ga")).toHaveTextContent("false");
    expect(screen.getByTestId("show-banner")).toHaveTextContent("false");
    expect(screen.queryByTestId("google-analytics")).not.toBeInTheDocument();
  });

  it("fresh visitor (no stored choice): resolves to undecided and shows the banner", async () => {
    renderWithProvider("G-TEST123");
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("undecided"));
    expect(screen.getByTestId("show-banner")).toHaveTextContent("true");
    expect(screen.queryByTestId("google-analytics")).not.toBeInTheDocument();
  });

  it("a malformed stored value falls back to undecided (banner shown)", async () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "yes-please");
    renderWithProvider("G-TEST123");
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("undecided"));
    expect(screen.getByTestId("show-banner")).toHaveTextContent("true");
    expect(screen.queryByTestId("google-analytics")).not.toBeInTheDocument();
  });

  it("returning granted visitor: banner hidden, GA mounts exactly once", async () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
    renderWithProvider("G-TEST123");
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("granted"));
    expect(screen.getByTestId("show-banner")).toHaveTextContent("false");
    expect(screen.getAllByTestId("google-analytics")).toHaveLength(1);
    expect(screen.getByTestId("google-analytics")).toHaveAttribute("data-ga-id", "G-TEST123");
  });

  it("returning denied visitor: banner hidden, GA never mounts", async () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");
    renderWithProvider("G-TEST123");
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("denied"));
    expect(screen.getByTestId("show-banner")).toHaveTextContent("false");
    expect(screen.queryByTestId("google-analytics")).not.toBeInTheDocument();
  });

  it("Allow: persists granted, sends a consent update, and mounts GA", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    const user = userEvent.setup();
    renderWithProvider("G-TEST123");
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("undecided"));

    await user.click(screen.getByText("allow"));

    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");
    expect(gtag).toHaveBeenCalledExactlyOnceWith("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    expect(screen.getByTestId("show-banner")).toHaveTextContent("false");
    expect(screen.getAllByTestId("google-analytics")).toHaveLength(1);
  });

  it("Decline: persists denied, sends a consent update, and GA never mounts", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    const user = userEvent.setup();
    renderWithProvider("G-TEST123");
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("undecided"));

    await user.click(screen.getByText("decline"));

    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("denied");
    expect(gtag).toHaveBeenCalledExactlyOnceWith("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    expect(screen.getByTestId("show-banner")).toHaveTextContent("false");
    expect(screen.queryByTestId("google-analytics")).not.toBeInTheDocument();
  });

  it("reopen(): a returning granted visitor can bring the banner back and switch to denied immediately", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
    const user = userEvent.setup();
    renderWithProvider("G-TEST123");
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("granted"));
    expect(screen.getByTestId("show-banner")).toHaveTextContent("false");

    await user.click(screen.getByText("reopen"));
    expect(screen.getByTestId("show-banner")).toHaveTextContent("true");
    // GA was already loaded this session and stays mounted — the change
    // only stops future consent/events, it doesn't retroactively unload it.
    expect(screen.getAllByTestId("google-analytics")).toHaveLength(1);

    await user.click(screen.getByText("decline"));
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("denied");
    expect(gtag).toHaveBeenCalledExactlyOnceWith("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    expect(screen.getByTestId("show-banner")).toHaveTextContent("false");
  });

  it("reopen(): a returning denied visitor can switch to granted without a reload", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");
    const user = userEvent.setup();
    renderWithProvider("G-TEST123");
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("denied"));
    expect(screen.queryByTestId("google-analytics")).not.toBeInTheDocument();

    await user.click(screen.getByText("reopen"));
    expect(screen.getByTestId("show-banner")).toHaveTextContent("true");

    await user.click(screen.getByText("allow"));
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");
    expect(screen.getByTestId("show-banner")).toHaveTextContent("false");
    expect(screen.getAllByTestId("google-analytics")).toHaveLength(1);
  });
});

describe("useAnalyticsConsent outside a provider", () => {
  it("returns a safe inert default instead of throwing", () => {
    expect(() => render(<Harness />)).not.toThrow();
    expect(screen.getByTestId("has-ga")).toHaveTextContent("false");
    expect(screen.getByTestId("show-banner")).toHaveTextContent("false");
  });
});
