/**
 * Calls the REAL Vercel Web Analytics API, once, using whatever credentials
 * are set in the environment — this is how the client is confirmed to work
 * against real data, not just that it type-checks or passes mocked tests.
 *
 * Run locally (from a machine with real network access to api.vercel.com —
 * this script makes a genuine outbound HTTPS request):
 *
 *   VERCEL_API_TOKEN=... VERCEL_PROJECT_ID=... [VERCEL_TEAM_ID=...] \
 *     npm run verify:analytics
 *
 * That script requires NODE_OPTIONS=--conditions=react-server (already set
 * by the npm script above) — lib/server/vercel-analytics.ts imports the
 * `server-only` marker package, which throws unless resolved through the
 * `react-server` export condition Next.js's own bundler normally sets. A
 * plain `tsx` invocation without that flag will fail before ever reaching
 * this file's code, not because of anything wrong with the analytics client.
 *
 * Deliberately NOT wired into `npm test` or the CI gate sequence — it makes
 * a real network call and requires real credentials, neither of which
 * belong in an automated test suite.
 */
import { getVisitorSummary } from "../lib/server/vercel-analytics";

async function main() {
  console.log("Calling Vercel Web Analytics API: getVisitorSummary(\"last7days\")...\n");

  const summary = await getVisitorSummary("last7days");

  console.log("Success. Real response:\n");
  console.log(JSON.stringify(summary, null, 2));

  console.log(`\nPeriod queried: ${summary.period.label} (${summary.period.since} to ${summary.period.until})`);
  console.log(`Visitors: ${summary.visitors}`);
  console.log(`Page views: ${summary.pageviews}`);

  if (summary.visitors === 0 && summary.pageviews === 0) {
    console.log(
      "\nBoth totals are zero. For a brand-new project this can be genuinely correct " +
        "(no traffic yet, or Web Analytics was enabled too recently for this window) " +
        "rather than a bug — cross-check against the Vercel dashboard's Analytics tab " +
        "for the same project and date range before assuming something is wrong.",
    );
  }
}

main().catch((error) => {
  console.error("Verification call failed:\n");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
