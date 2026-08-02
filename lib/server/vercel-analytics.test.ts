import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCountryBreakdown,
  getCustomEventSummary,
  getDeviceBreakdown,
  getPageViewSummary,
  getTopPages,
  getTopReferrers,
  getVisitorSummary,
  resolvePeriod,
  SHIPPED_CUSTOM_EVENTS,
  VercelAnalyticsApiError,
} from "@/lib/server/vercel-analytics";

const ORIGINAL_ENV = { ...process.env };
const TOKEN = "vc_super_secret_token_do_not_leak";

function setEnv(overrides: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(init.headers ?? {}),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  setEnv({ VERCEL_API_TOKEN: TOKEN, VERCEL_PROJECT_ID: "prj_test123", VERCEL_TEAM_ID: undefined });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  setEnv(ORIGINAL_ENV);
  vi.unstubAllGlobals();
});

describe("resolvePeriod", () => {
  const pinnedNow = new Date("2026-08-15T12:34:56.000Z");

  it("computes last7days as the 7 complete UTC days ending yesterday", () => {
    const period = resolvePeriod("last7days", pinnedNow);
    expect(period.since).toBe("2026-08-08");
    expect(period.until).toBe("2026-08-14");
  });

  it("computes previous7days as the 7 days immediately before last7days", () => {
    const period = resolvePeriod("previous7days", pinnedNow);
    expect(period.since).toBe("2026-08-01");
    expect(period.until).toBe("2026-08-07");
  });

  it("computes last30days as the 30 complete UTC days ending yesterday", () => {
    const period = resolvePeriod("last30days", pinnedNow);
    expect(period.since).toBe("2026-07-16");
    expect(period.until).toBe("2026-08-14");
  });

  it("never includes today, which is still in progress", () => {
    const period = resolvePeriod("last7days", pinnedNow);
    expect(period.until).not.toBe("2026-08-15");
  });

  it("crosses a month boundary correctly", () => {
    const period = resolvePeriod("last7days", new Date("2026-03-03T00:00:00.000Z"));
    expect(period.since).toBe("2026-02-24");
    expect(period.until).toBe("2026-03-02");
  });
});

describe("missing environment variables", () => {
  it("throws a clear error when VERCEL_API_TOKEN is missing, without calling fetch", async () => {
    setEnv({ VERCEL_API_TOKEN: undefined });
    await expect(getVisitorSummary("last7days")).rejects.toThrow(/VERCEL_API_TOKEN/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a clear error when VERCEL_PROJECT_ID is missing, without calling fetch", async () => {
    setEnv({ VERCEL_PROJECT_ID: undefined });
    await expect(getVisitorSummary("last7days")).rejects.toThrow(/VERCEL_PROJECT_ID/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getPageViewSummary / getVisitorSummary", () => {
  it("parses a visits/count response into a typed summary", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: 1, query: {}, data: { pageviews: 1250, visitors: 980 } }),
    );
    const summary = await getPageViewSummary("last7days");
    expect(summary.pageviews).toBe(1250);
    expect(summary.visitors).toBe(980);
    expect(summary.period.key).toBe("last7days");
  });

  it("requests visits/count with since/until and no teamId for a personal-account project", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: 1, query: {}, data: { pageviews: 10, visitors: 8 } }),
    );
    await getVisitorSummary("last7days", new Date("2026-08-15T00:00:00.000Z"));
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.pathname).toBe("/v1/query/web-analytics/visits/count");
    expect(requestedUrl.searchParams.get("projectId")).toBe("prj_test123");
    expect(requestedUrl.searchParams.get("since")).toBe("2026-08-08");
    expect(requestedUrl.searchParams.get("until")).toBe("2026-08-14");
    expect(requestedUrl.searchParams.has("teamId")).toBe(false);
  });

  it("includes teamId when VERCEL_TEAM_ID is set", async () => {
    setEnv({ VERCEL_TEAM_ID: "team_test456" });
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: 1, query: {}, data: { pageviews: 1, visitors: 1 } }),
    );
    await getVisitorSummary("last7days");
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get("teamId")).toBe("team_test456");
  });

  it("never includes the bearer token anywhere in the request URL", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: 1, query: {}, data: { pageviews: 1, visitors: 1 } }),
    );
    await getVisitorSummary("last7days");
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.toString()).not.toContain(TOKEN);
  });

  it("sends the bearer token only in the Authorization header", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: 1, query: {}, data: { pageviews: 1, visitors: 1 } }),
    );
    await getVisitorSummary("last7days");
    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect((requestInit.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
  });
});

describe("getTopPages / getTopReferrers / getDeviceBreakdown / getCountryBreakdown", () => {
  it("parses a visits/aggregate response grouped by requestPath", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        version: 1,
        query: { since: "2026-08-08", until: "2026-08-14", groupBy: ["requestPath"], limit: 10 },
        data: [
          { requestPath: "/components/button", pageviews: 42, visitors: 30 },
          { requestPath: "/", pageviews: 20, visitors: 15 },
        ],
      }),
    );
    const result = await getTopPages("last7days");
    expect(result.pages).toEqual([
      { requestPath: "/components/button", pageviews: 42, visitors: 30 },
      { requestPath: "/", pageviews: 20, visitors: 15 },
    ]);
  });

  it("requests visits/aggregate grouped by referrerHostname", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: 1, query: {}, data: [{ referrerHostname: "google.com", pageviews: 5, visitors: 4 }] }),
    );
    await getTopReferrers("last7days");
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.pathname).toBe("/v1/query/web-analytics/visits/aggregate");
    expect(requestedUrl.searchParams.get("by")).toBe("referrerHostname");
  });

  it("requests visits/aggregate grouped by deviceType", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: 1, query: {}, data: [{ deviceType: "desktop", pageviews: 5, visitors: 4 }] }),
    );
    const result = await getDeviceBreakdown("last7days");
    expect(result.devices).toEqual([{ deviceType: "desktop", pageviews: 5, visitors: 4 }]);
  });

  it("requests visits/aggregate grouped by country, respecting a custom limit", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: 1, query: {}, data: [{ country: "US", pageviews: 5, visitors: 4 }] }),
    );
    await getCountryBreakdown("last7days", 25);
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get("by")).toBe("country");
    expect(requestedUrl.searchParams.get("limit")).toBe("25");
  });
});

describe("getCustomEventSummary", () => {
  it("fires one events/count call per shipped custom event, filtered by eventName", async () => {
    fetchMock.mockImplementation(async (url: URL) => {
      const filter = url.searchParams.get("filter") ?? "";
      const eventName = /eventName eq '([^']+)'/.exec(filter)?.[1];
      return jsonResponse({
        version: 1,
        query: {},
        data: { count: eventName === "component_viewed" ? 100 : 10, visitors: 5 },
      });
    });

    const summary = await getCustomEventSummary("last7days");

    expect(fetchMock).toHaveBeenCalledTimes(SHIPPED_CUSTOM_EVENTS.length);
    expect(summary.events.component_viewed.count).toBe(100);
    expect(summary.events.component_code_copied.count).toBe(10);
    expect(summary.events.navigation_cta_clicked.count).toBe(10);
    for (const eventName of SHIPPED_CUSTOM_EVENTS) {
      expect(summary.events[eventName].visitors).toBe(5);
    }
  });

  it("hits the events/count endpoint, not events/aggregate", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: 1, query: {}, data: { count: 0, visitors: 0 } }));
    await getCustomEventSummary("last7days");
    for (const call of fetchMock.mock.calls) {
      const url = call[0] as URL;
      expect(url.pathname).toBe("/v1/query/web-analytics/events/count");
    }
  });
});

describe("rate limit handling", () => {
  it("throws VercelAnalyticsApiError with status 429 and parsed Retry-After", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, { status: 429, headers: { "Retry-After": "30" } }));
    const error = await getVisitorSummary("last7days").catch((e) => e);
    expect(error).toBeInstanceOf(VercelAnalyticsApiError);
    expect(error.status).toBe(429);
    expect(error.retryAfterSeconds).toBe(30);
  });

  it("still reports a 429 without a Retry-After header, just without a retry hint", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, { status: 429 }));
    const error = await getVisitorSummary("last7days").catch((e) => e);
    expect(error.status).toBe(429);
    expect(error.retryAfterSeconds).toBeUndefined();
  });
});

describe("non-200 API failures", () => {
  it("throws VercelAnalyticsApiError for a 400 invalid-query response", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "invalid filter" }, { status: 400 }),
    );
    const error = await getVisitorSummary("last7days").catch((e) => e);
    expect(error).toBeInstanceOf(VercelAnalyticsApiError);
    expect(error.status).toBe(400);
  });

  it("throws VercelAnalyticsApiError for a 401 unauthorized response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, { status: 401 }));
    const error = await getVisitorSummary("last7days").catch((e) => e);
    expect(error.status).toBe(401);
  });

  it("never includes the bearer token in a thrown error's message", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "unauthorized", token: TOKEN }, { status: 401 }),
    );
    const error: Error = await getVisitorSummary("last7days").catch((e) => e);
    // Even if a misbehaving API echoed a token-shaped value back, the error
    // message must never contain OUR actual secret token value.
    expect(error.message).not.toContain(TOKEN);
  });

  it("handles an empty aggregate result (new project with no history yet) without throwing", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ version: 1, query: {}, data: [] }));
    const result = await getTopPages("last7days");
    expect(result.pages).toEqual([]);
  });

  it("handles a zero-valued count response (no traffic yet) without throwing", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: 1, query: {}, data: { pageviews: 0, visitors: 0 } }),
    );
    const summary = await getVisitorSummary("last7days");
    expect(summary.visitors).toBe(0);
    expect(summary.pageviews).toBe(0);
  });
});

describe("request timeout", () => {
  it("throws a clear timeout error when the request is aborted", async () => {
    fetchMock.mockImplementation(() => {
      const error = new Error("The operation was aborted.");
      error.name = "AbortError";
      return Promise.reject(error);
    });
    const error = await getVisitorSummary("last7days").catch((e) => e);
    expect(error).toBeInstanceOf(VercelAnalyticsApiError);
    expect(error.message).toMatch(/timed out/i);
  });

  it("throws a clear error for a generic network failure", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new TypeError("fetch failed")));
    const error = await getVisitorSummary("last7days").catch((e) => e);
    expect(error).toBeInstanceOf(VercelAnalyticsApiError);
  });
});
