import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  readStoredAnalyticsConsent,
  writeStoredAnalyticsConsent,
} from "@/lib/consent";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("readStoredAnalyticsConsent", () => {
  it("returns null on first visit (nothing stored)", () => {
    expect(readStoredAnalyticsConsent()).toBeNull();
  });

  it("returns 'granted' when that was stored", () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
    expect(readStoredAnalyticsConsent()).toBe("granted");
  });

  it("returns 'denied' when that was stored", () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");
    expect(readStoredAnalyticsConsent()).toBe("denied");
  });

  it("returns null for a malformed stored value", () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "yes-please");
    expect(readStoredAnalyticsConsent()).toBeNull();
  });

  it("returns null for an empty-string stored value", () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "");
    expect(readStoredAnalyticsConsent()).toBeNull();
  });

  it("returns null (not throw) when localStorage access throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => readStoredAnalyticsConsent()).not.toThrow();
    expect(readStoredAnalyticsConsent()).toBeNull();
  });

  it("returns null (not throw) during SSR, where window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(() => readStoredAnalyticsConsent()).not.toThrow();
    expect(readStoredAnalyticsConsent()).toBeNull();
  });
});

describe("writeStoredAnalyticsConsent", () => {
  it("persists 'granted'", () => {
    writeStoredAnalyticsConsent("granted");
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");
  });

  it("persists 'denied'", () => {
    writeStoredAnalyticsConsent("denied");
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("denied");
  });

  it("does not throw when localStorage.setItem throws", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("quota exceeded");
      },
    });
    expect(() => writeStoredAnalyticsConsent("granted")).not.toThrow();
  });

  it("does not throw during SSR, where window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(() => writeStoredAnalyticsConsent("granted")).not.toThrow();
  });
});
