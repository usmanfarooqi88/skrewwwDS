import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runShadcnRuntime } from "@/lib/ccv/css/runtime-browser";
import { judgeFocusVisible, judgeFoundationActive, judgeRuntimeSupplied, judgeScenario } from "@/lib/ccv/css/runtime-judge";

/**
 * Real Chromium against tiny fixture pages on loopback. Gated: `npm test` in CI
 * has no browser, so this runs only with CCV_BROWSER_TESTS=1 (owner/local).
 */
const PAGES: Record<string, string> = {
  "/common": `<style>:root{--f-a:1px;--f-ring:rgb(108,76,242)} button:focus-visible{outline:2px solid var(--f-ring)}</style><button>Action</button>`,
  "/common-broken": `<style>:root{--f-a:1px} button{outline:none} button:focus-visible{outline:none}</style><button>Action</button>`,
  "/slider": `<div class="fill" style="--slider-fill-percent:40%"></div>`,
  "/error": `<div>x</div><script>throw new Error("boom")</script>`,
};

let server: Server;
let origin = "";
beforeAll(async () => {
  server = createServer((req, res) => {
    const body = PAGES[req.url ?? ""];
    res.writeHead(body ? 200 : 404, { "content-type": "text/html" });
    res.end(body ? `<!doctype html><html><body>${body}</body></html>` : "missing");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe.skipIf(!process.env.CCV_BROWSER_TESTS)("CCV-4 runtime collector — real Chromium (CCV_BROWSER_TESTS=1)", () => {
  it("collects Foundation, focus-visible, runtime-supplied and scenario evidence; judges pass", async () => {
    const run = await runShadcnRuntime({ commonUrl: `${origin}/common`, controlLabel: "Action", rootDeclared: ["--f-a", "--f-ring"], scenarios: [{ name: "slider", kind: "render", url: `${origin}/slider`, supplied: ["--slider-fill-percent"] }], launchOptions: {} });
    expect(judgeFoundationActive(run.foundation).status).toBe("pass");
    expect(judgeFocusVisible(run.focus).status).toBe("pass");
    expect(judgeRuntimeSupplied(run.supplied[0])).toMatchObject({ status: "pass" });
    expect(judgeScenario(run.scenarios[0]).status).toBe("pass");
  }, 120_000);

  it("mutations in a real page: missing :root token, no focus outline, absent supplied value, page error, 404 route", async () => {
    const run = await runShadcnRuntime({
      commonUrl: `${origin}/common-broken`,
      controlLabel: "Action",
      rootDeclared: ["--f-a", "--f-ring"],
      scenarios: [
        { name: "error", kind: "render", url: `${origin}/error`, supplied: ["--slider-fill-percent"] },
        { name: "missing", kind: "render", url: `${origin}/nope` },
      ],
      launchOptions: {},
    });
    expect(judgeFoundationActive(run.foundation)).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
    expect(judgeFocusVisible(run.focus)).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
    expect(judgeRuntimeSupplied(run.supplied[0])).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
    expect(judgeScenario(run.scenarios[0])).toMatchObject({ status: "fail", failureCode: "INTERACTION_FAILED" });
    expect(judgeScenario(run.scenarios[1])).toMatchObject({ status: "fail", failureCode: "INTERACTION_FAILED" });
  }, 120_000);
});
