import type { CcvFailureCode } from "@/lib/ccv/failure-codes";

/**
 * CCV-5 — read-only HTTP for the public modes, injectable so every verdict is
 * testable offline. The classifier decides what a response MEANS for provenance:
 * only an explicit "not found" is evidence that an expected public artifact is
 * absent (FAIL). Anything that stops the verifier from seeing the artifact —
 * unreachable host, 5xx, rate limit, an unexpected status, a redirect to another
 * origin — leaves provenance UNKNOWN with ENVIRONMENT_ERROR, never a silent pass.
 */

export type FetchOutcome =
  | { kind: "response"; status: number; bytes: Uint8Array; contentType?: string; finalUrl: string }
  | { kind: "network-error"; message: string };

export type Fetcher = (url: string, options?: { timeoutMs?: number }) => Promise<FetchOutcome>;

export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

export const httpFetcher: Fetcher = async (url, options) => {
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS), headers: { "user-agent": "skrewww-ccv/1 (read-only provenance check)", accept: "*/*" } });
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { kind: "response", status: response.status, bytes, contentType: response.headers.get("content-type") ?? undefined, finalUrl: response.url || url };
  } catch (error) {
    const cause = (error as { cause?: { code?: string; message?: string } }).cause;
    return { kind: "network-error", message: `${cause?.code ?? (error as Error).name}: ${cause?.message ?? (error as Error).message}`.slice(0, 200) };
  }
};

export type FetchClass =
  | { class: "ok"; status: number; bytes: Uint8Array; contentType?: string }
  | { class: "absent"; status: number }
  | { class: "unavailable"; detail: string };

function originOf(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

/** `requestedOrigin` guards against a redirect that leaves the origin being verified. */
export function classifyFetch(outcome: FetchOutcome, requestedOrigin: string): FetchClass {
  if (outcome.kind === "network-error") return { class: "unavailable", detail: `unreachable (${outcome.message})` };
  const finalOrigin = originOf(outcome.finalUrl) ?? requestedOrigin; // an unparsable final URL cannot show a redirect
  if (finalOrigin !== requestedOrigin) return { class: "unavailable", detail: `redirected off origin to ${finalOrigin}` };
  if (outcome.status === 200) return { class: "ok", status: 200, bytes: outcome.bytes, contentType: outcome.contentType };
  if (outcome.status === 404 || outcome.status === 410) return { class: "absent", status: outcome.status };
  return { class: "unavailable", detail: `HTTP ${outcome.status}` };
}

export const unavailableCode: CcvFailureCode = "ENVIRONMENT_ERROR";
export const absentCode: CcvFailureCode = "PROVENANCE_MISMATCH";

export async function mapLimit<T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
