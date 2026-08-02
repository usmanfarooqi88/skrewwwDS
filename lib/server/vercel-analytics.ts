import "server-only";

/**
 * Server-only client for Vercel's public Web Analytics API
 * (https://vercel.com/docs/analytics/web-analytics-api, launched May 2026).
 *
 * Scope of this module, deliberately: the data-fetching layer only. No AI
 * report generation, no cron job, no authenticated reporting endpoint — those
 * are held for a later pass once there's 2+ weeks of real traffic. This file
 * exists so that later pass has a typed, tested client to build on, verified
 * against whatever real (even minimal) traffic exists today.
 *
 * Confirmed against Vercel's live documentation before writing any code
 * (not assumed from training data):
 * - Base: https://api.vercel.com
 * - GET /v1/query/web-analytics/visits/count
 * - GET /v1/query/web-analytics/visits/aggregate
 * - GET /v1/query/web-analytics/events/count
 * - GET /v1/query/web-analytics/events/aggregate
 * - Auth: `Authorization: Bearer <token>` header.
 * - `projectId` required on every request; `teamId` (or `slug`) required only
 *   for team-owned projects — omitted entirely for personal-account projects.
 * - Count endpoints: since/until optional, query production data only.
 * - Aggregate endpoints: since/until required, `by` required (up to two
 *   dimensions, at most one time granularity), `limit` optional (1-100,
 *   default 10, excess grouped into "Others"), query data within the
 *   account's plan reporting window.
 * - `eventName` is a valid `by`/`filter` dimension for the events dataset.
 * - Filters use OData syntax, e.g. `eventName eq 'component_viewed'`.
 *
 * The REST API reference pages' auto-generated response schemas list a huge
 * shared "observability record" shape (hundreds of unrelated fields spanning
 * every Vercel product) that is clearly reused boilerplate, not specific to
 * these endpoints — the response types below instead match the concrete,
 * worked request/response examples in Vercel's Web Analytics API how-to
 * guide, which are the only examples of the endpoints' *real* response shape.
 */

const VERCEL_API_BASE = "https://api.vercel.com";
const REQUEST_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface VercelAnalyticsConfig {
  token: string;
  projectId: string;
  /** Omitted for projects owned by a personal account, not a team. */
  teamId?: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your Vercel project's ` +
        `environment variables (or .env.local for local development) — see .env.example ` +
        `for where each value comes from.`,
    );
  }
  return value;
}

/**
 * Reads and validates configuration. Called lazily inside each request —
 * never at module load — so importing this file doesn't crash a build or a
 * test that never actually calls the API.
 */
function getConfig(): VercelAnalyticsConfig {
  return {
    token: getRequiredEnv("VERCEL_API_TOKEN"),
    projectId: getRequiredEnv("VERCEL_PROJECT_ID"),
    teamId: process.env.VERCEL_TEAM_ID || undefined,
  };
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Thrown for any non-2xx response, a request timeout, or a network failure.
 * Never constructed with the bearer token or request headers — only the
 * path, status, and (truncated) response body, none of which can contain
 * the token since it's sent as a header, never echoed back.
 */
export class VercelAnalyticsApiError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = "VercelAnalyticsApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// ---------------------------------------------------------------------------
// Period handling — UTC, "complete days" only (excludes today, which is
// still in progress and would otherwise make period-over-period comparisons
// misleading).
// ---------------------------------------------------------------------------

export type PeriodKey = "last7days" | "previous7days" | "last30days";

export interface Period {
  key: PeriodKey;
  label: string;
  /** Inclusive, UTC, YYYY-MM-DD. */
  since: string;
  /** Inclusive, UTC, YYYY-MM-DD. */
  until: string;
}

function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** UTC midnight for `daysAgo` days before `now`'s UTC calendar date. */
function utcDateDaysAgo(now: Date, daysAgo: number): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo),
  );
}

/**
 * Resolves a period key to concrete UTC date boundaries. `now` defaults to
 * the real current time but is an explicit parameter so tests can pin it
 * instead of depending on the real clock (the exact bug class fixed
 * elsewhere in this codebase's date-handling code).
 */
export function resolvePeriod(key: PeriodKey, now: Date = new Date()): Period {
  // "Yesterday" is the most recent complete UTC day — today is still in
  // progress and would make period totals look artificially low.
  const yesterday = utcDateDaysAgo(now, 1);

  switch (key) {
    case "last7days":
      return {
        key,
        label: "Last 7 complete days (UTC)",
        since: toUtcDateString(utcDateDaysAgo(now, 7)),
        until: toUtcDateString(yesterday),
      };
    case "previous7days":
      return {
        key,
        label: "Previous 7 complete days (UTC)",
        since: toUtcDateString(utcDateDaysAgo(now, 14)),
        until: toUtcDateString(utcDateDaysAgo(now, 8)),
      };
    case "last30days":
      return {
        key,
        label: "Last 30 complete days (UTC)",
        since: toUtcDateString(utcDateDaysAgo(now, 30)),
        until: toUtcDateString(yesterday),
      };
  }
}

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------

type QueryParams = Record<string, string | number | undefined>;

async function vercelAnalyticsRequest<T>(path: string, params: QueryParams): Promise<T> {
  const config = getConfig();
  const url = new URL(`${VERCEL_API_BASE}${path}`);
  url.searchParams.set("projectId", config.projectId);
  if (config.teamId) url.searchParams.set("teamId", config.teamId);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.token}` },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new VercelAnalyticsApiError(
        `Vercel Analytics API request to ${path} timed out after ${REQUEST_TIMEOUT_MS}ms.`,
        0,
      );
    }
    throw new VercelAnalyticsApiError(
      `Vercel Analytics API request to ${path} failed before receiving a response.`,
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 429) {
    const retryAfterHeader = response.headers.get("Retry-After");
    throw new VercelAnalyticsApiError(
      `Vercel Analytics API rate limit exceeded for ${path}.`,
      429,
      retryAfterHeader ? Number(retryAfterHeader) : undefined,
    );
  }

  if (!response.ok) {
    // The token is only ever sent as a request header, never echoed back by
    // a well-behaved API — but error messages get logged, so redact it
    // defensively anyway rather than trusting that assumption to always
    // hold, then truncate in case of an unexpectedly large error page.
    const bodyText = await response.text().catch(() => "");
    const safeBodyText = bodyText.split(config.token).join("[REDACTED]");
    throw new VercelAnalyticsApiError(
      `Vercel Analytics API returned ${response.status} for ${path}.` +
        (safeBodyText ? ` Response: ${safeBodyText.slice(0, 500)}` : ""),
      response.status,
    );
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Response shapes — matching the how-to guide's worked examples, not the
// generic auto-generated reference schema (see file header comment).
// ---------------------------------------------------------------------------

interface VisitsCountResponse {
  version: number;
  query: { since?: string; until?: string; filter?: string };
  data: { pageviews: number; visitors: number };
}

interface EventsCountResponse {
  version: number;
  query: { since?: string; until?: string; filter?: string };
  data: { count: number; visitors: number };
}

interface VisitsAggregateTimeRow {
  timestamp: string;
  pageviews: number;
  visitors: number;
}

interface VisitsAggregateDimensionRow {
  [dimension: string]: string | number;
}

interface VisitsAggregateResponse {
  version: number;
  query: { since: string; until: string; groupBy: string[]; filter?: string; limit: number };
  data: (VisitsAggregateTimeRow | VisitsAggregateDimensionRow)[];
}

// ---------------------------------------------------------------------------
// Public typed functions
// ---------------------------------------------------------------------------

export interface PageViewSummary {
  period: Period;
  pageviews: number;
  visitors: number;
}

/**
 * Total page views (and visitors) for a period. Wraps `visits/count`, which
 * returns both metrics together — see also `getVisitorSummary`.
 */
export async function getPageViewSummary(periodKey: PeriodKey, now?: Date): Promise<PageViewSummary> {
  const period = resolvePeriod(periodKey, now);
  const response = await vercelAnalyticsRequest<VisitsCountResponse>(
    "/v1/query/web-analytics/visits/count",
    { since: period.since, until: period.until },
  );
  return { period, pageviews: response.data.pageviews, visitors: response.data.visitors };
}

export interface VisitorSummary {
  period: Period;
  visitors: number;
  pageviews: number;
}

/**
 * Total unique visitors (and page views) for a period. Wraps the same
 * `visits/count` endpoint as `getPageViewSummary` — provided as a separate
 * function because "how many people visited" and "how many pages were
 * viewed" are different questions callers ask for, even though one API call
 * answers both.
 */
export async function getVisitorSummary(periodKey: PeriodKey, now?: Date): Promise<VisitorSummary> {
  const period = resolvePeriod(periodKey, now);
  const response = await vercelAnalyticsRequest<VisitsCountResponse>(
    "/v1/query/web-analytics/visits/count",
    { since: period.since, until: period.until },
  );
  return { period, visitors: response.data.visitors, pageviews: response.data.pageviews };
}

export interface TopPage {
  requestPath: string;
  pageviews: number;
  visitors: number;
}

export interface TopPagesResult {
  period: Period;
  pages: TopPage[];
}

/**
 * Top pages by page views. Groups by `requestPath` (the exact URL path),
 * not `route` (the framework route pattern) — this site's component pages
 * all share one dynamic route (`/components/[slug]`), so grouping by route
 * would collapse every component page into a single, useless row.
 */
export async function getTopPages(
  periodKey: PeriodKey,
  limit = 10,
  now?: Date,
): Promise<TopPagesResult> {
  const period = resolvePeriod(periodKey, now);
  const response = await vercelAnalyticsRequest<VisitsAggregateResponse>(
    "/v1/query/web-analytics/visits/aggregate",
    { since: period.since, until: period.until, by: "requestPath", limit },
  );
  const pages = response.data.map((row) => ({
    requestPath: String((row as VisitsAggregateDimensionRow).requestPath ?? ""),
    pageviews: Number((row as VisitsAggregateDimensionRow).pageviews ?? 0),
    visitors: Number((row as VisitsAggregateDimensionRow).visitors ?? 0),
  }));
  return { period, pages };
}

export interface TopReferrer {
  referrerHostname: string;
  pageviews: number;
  visitors: number;
}

export interface TopReferrersResult {
  period: Period;
  referrers: TopReferrer[];
}

export async function getTopReferrers(
  periodKey: PeriodKey,
  limit = 10,
  now?: Date,
): Promise<TopReferrersResult> {
  const period = resolvePeriod(periodKey, now);
  const response = await vercelAnalyticsRequest<VisitsAggregateResponse>(
    "/v1/query/web-analytics/visits/aggregate",
    { since: period.since, until: period.until, by: "referrerHostname", limit },
  );
  const referrers = response.data.map((row) => ({
    referrerHostname: String((row as VisitsAggregateDimensionRow).referrerHostname ?? ""),
    pageviews: Number((row as VisitsAggregateDimensionRow).pageviews ?? 0),
    visitors: Number((row as VisitsAggregateDimensionRow).visitors ?? 0),
  }));
  return { period, referrers };
}

export interface DeviceBreakdownRow {
  deviceType: string;
  pageviews: number;
  visitors: number;
}

export interface DeviceBreakdownResult {
  period: Period;
  devices: DeviceBreakdownRow[];
}

export async function getDeviceBreakdown(
  periodKey: PeriodKey,
  limit = 10,
  now?: Date,
): Promise<DeviceBreakdownResult> {
  const period = resolvePeriod(periodKey, now);
  const response = await vercelAnalyticsRequest<VisitsAggregateResponse>(
    "/v1/query/web-analytics/visits/aggregate",
    { since: period.since, until: period.until, by: "deviceType", limit },
  );
  const devices = response.data.map((row) => ({
    deviceType: String((row as VisitsAggregateDimensionRow).deviceType ?? ""),
    pageviews: Number((row as VisitsAggregateDimensionRow).pageviews ?? 0),
    visitors: Number((row as VisitsAggregateDimensionRow).visitors ?? 0),
  }));
  return { period, devices };
}

export interface CountryBreakdownRow {
  country: string;
  pageviews: number;
  visitors: number;
}

export interface CountryBreakdownResult {
  period: Period;
  countries: CountryBreakdownRow[];
}

export async function getCountryBreakdown(
  periodKey: PeriodKey,
  limit = 10,
  now?: Date,
): Promise<CountryBreakdownResult> {
  const period = resolvePeriod(periodKey, now);
  const response = await vercelAnalyticsRequest<VisitsAggregateResponse>(
    "/v1/query/web-analytics/visits/aggregate",
    { since: period.since, until: period.until, by: "country", limit },
  );
  const countries = response.data.map((row) => ({
    country: String((row as VisitsAggregateDimensionRow).country ?? ""),
    pageviews: Number((row as VisitsAggregateDimensionRow).pageviews ?? 0),
    visitors: Number((row as VisitsAggregateDimensionRow).visitors ?? 0),
  }));
  return { period, countries };
}

/** The 3 custom events shipped in Phase 1 (see lib/analytics.ts). */
export const SHIPPED_CUSTOM_EVENTS = [
  "component_viewed",
  "component_code_copied",
  "navigation_cta_clicked",
] as const;

export type ShippedCustomEvent = (typeof SHIPPED_CUSTOM_EVENTS)[number];

export interface CustomEventSummary {
  period: Period;
  events: Record<ShippedCustomEvent, { count: number; visitors: number }>;
}

/**
 * Totals for exactly the 3 custom events shipped in Phase 1, one
 * `events/count` call per event name (filtered by `eventName eq '<name>'`).
 * Deliberately not a single `events/aggregate` grouped by `eventName`: with
 * only 3 named events to track, per-event count calls give exact totals
 * without aggregate's top-N "Others" bucketing ever obscuring one of them.
 */
export async function getCustomEventSummary(
  periodKey: PeriodKey,
  now?: Date,
): Promise<CustomEventSummary> {
  const period = resolvePeriod(periodKey, now);

  const results = await Promise.all(
    SHIPPED_CUSTOM_EVENTS.map((eventName) =>
      vercelAnalyticsRequest<EventsCountResponse>("/v1/query/web-analytics/events/count", {
        since: period.since,
        until: period.until,
        filter: `eventName eq '${eventName}'`,
      }),
    ),
  );

  const events = SHIPPED_CUSTOM_EVENTS.reduce(
    (acc, eventName, index) => {
      acc[eventName] = { count: results[index].data.count, visitors: results[index].data.visitors };
      return acc;
    },
    {} as Record<ShippedCustomEvent, { count: number; visitors: number }>,
  );

  return { period, events };
}
