/**
 * Tier B external-consumer smoke test (see
 * docs/architecture/shadcn-distribution.md's "Verified External Consumer
 * Test" section for the manual run this automates).
 *
 * Scaffolds a real, pinned, Tailwind-free create-next-app project into
 * os.tmpdir() (never inside this repo), serves the @skrewww registry
 * locally from manifests built in-memory via lib/shadcn-registry-generator.ts
 * (no write to public/r/ — the Skrewww working tree is never touched),
 * installs @skrewww/button via the real, pinned shadcn CLI, wires and
 * verifies Foundation CSS activation, renders Button in a real page, and
 * confirms `next build` succeeds.
 *
 * Run: npm run smoke:consumer [-- --keep]
 * --keep preserves the OS-temp working directory and prints its path
 * instead of deleting it on exit.
 *
 * Deliberately NOT part of `npm test` / `npm run test:all` — this spins up
 * a real create-next-app + shadcn CLI install over the network and is far
 * heavier than anything else in that chain. See the architecture doc for
 * the tiering rationale (Tier A = pure-function unit tests, already in
 * test:all; Tier B = this script, manual/CI-optional; Tier C = production
 * registry, Tier D = real-browser interaction — both explicitly excluded
 * from the normal per-commit chain).
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { buildButtonManifest, buildFoundationManifest, type ShadcnRegistryItem } from "../lib/shadcn-registry-generator";

const CREATE_NEXT_APP_VERSION = "16.3.0";
const SHADCN_VERSION = "4.16.2";

const KEEP = process.argv.includes("--keep");

const MANIFEST_BUILDERS: Record<string, () => ShadcnRegistryItem> = {
  foundation: buildFoundationManifest,
  button: buildButtonManifest,
};

function log(line: string): void {
  console.log(line);
}

const failures: string[] = [];

function assert(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    log(`  ✔ ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    log(`  ✖ ${name}${detail ? ` — ${detail}` : ""}`);
    failures.push(name);
    throw new Error(`Assertion failed: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function targetToRelPath(target: string): string {
  if (!target.startsWith("~/")) {
    throw new Error(`Unexpected shadcn target shape (expected "~/..."): ${target}`);
  }
  return target.slice(2);
}

/** Resolves the full @skrewww registry dependency graph from a root item name, using the same pure builders the real generator script uses — no network, no filesystem write. */
function resolveGraph(rootName: string): ShadcnRegistryItem[] {
  const seen = new Set<string>();
  const items: ShadcnRegistryItem[] = [];
  function visit(name: string): void {
    if (seen.has(name)) return;
    seen.add(name);
    const builder = MANIFEST_BUILDERS[name];
    if (!builder) {
      throw new Error(
        `No local manifest builder registered for "${name}" in smoke-test-consumer.ts's MANIFEST_BUILDERS — ` +
          "the smoke test's registry graph is out of date relative to lib/shadcn-registry-generator.ts.",
      );
    }
    const item = builder();
    items.push(item);
    for (const dep of item.registryDependencies) {
      visit(dep.replace(/^@skrewww\//, ""));
    }
  }
  visit(rootName);
  return items;
}

function walkFiles(root: string, dir: string = root): string[] {
  const exclude = new Set(["node_modules", ".git", ".next"]);
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(root, full));
    } else {
      out.push(relative(root, full));
    }
  }
  return out;
}

function snapshotDir(root: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const relPath of walkFiles(root)) {
    const content = readFileSync(join(root, relPath));
    map.set(relPath, createHash("sha256").update(content).digest("hex"));
  }
  return map;
}

function diffSnapshots(
  pre: Map<string, string>,
  post: Map<string, string>,
): { added: string[]; removed: string[]; modified: string[] } {
  const added: string[] = [];
  const modified: string[] = [];
  post.forEach((hash, relPath) => {
    if (!pre.has(relPath)) added.push(relPath);
    else if (pre.get(relPath) !== hash) modified.push(relPath);
  });
  const removed = Array.from(pre.keys()).filter((relPath) => !post.has(relPath));
  return { added, removed, modified };
}

function readPackageDependencyNames(consumerDir: string): Set<string> {
  const pkg = JSON.parse(readFileSync(join(consumerDir, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
}

function startRegistryServer(rootDir: string): Promise<{ server: Server; baseUrl: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      // Explicit Connection: close on every response — without it, this
      // server's default keep-alive leaves the socket open after the
      // response completes, and shadcn's own fetch client does not
      // proactively drop the pooled connection, which keeps its process
      // alive indefinitely even though the actual request/response
      // already finished. A throwaway single-purpose local server for one
      // CLI invocation has no legitimate use for persistent connections.
      res.setHeader("Connection", "close");
      try {
        const urlPath = new URL(req.url ?? "/", "http://localhost").pathname;
        const filePath = join(rootDir, urlPath);
        if (!filePath.startsWith(rootDir)) {
          res.writeHead(403);
          res.end();
          return;
        }
        const data = readFileSync(filePath);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(data);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
    });
    server.keepAliveTimeout = 0;
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Registry server failed to bind to a dynamic loopback port."));
        return;
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function waitUntilReady(url: string, timeoutMs = 5000, intervalMs = 200): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Local registry server never became ready at ${url} within ${timeoutMs}ms.`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Non-blocking subprocess runner. Deliberately NOT execFileSync: this
 * script's local registry server runs in-process (same event loop), and
 * a synchronous child-process call would freeze that event loop for its
 * entire duration — including while `shadcn` is trying to make an HTTP
 * request back to that same process's server, which would then never be
 * accepted. Discovered the hard way: execFileSync here produced a
 * same-process deadlock indistinguishable from a hung CLI.
 */
function run(
  command: string,
  args: string[],
  options: { cwd?: string; captureStdout?: boolean } = {},
): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: options.captureStdout ? ["ignore", "pipe", "inherit"] : "inherit",
    });
    let stdout = "";
    if (options.captureStdout) {
      child.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout });
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

/** Finds the prerendered HTML for the "/" route and returns the stylesheet hrefs it actually links, so activation is proven against what the built route really references — not every CSS file next happens to emit. */
function findRootRouteStylesheetHrefs(consumerDir: string): string[] {
  const appServerDir = join(consumerDir, ".next", "server", "app");
  const candidates = ["page.html", "index.html"];
  let htmlPath: string | undefined;
  for (const candidate of candidates) {
    const candidatePath = join(appServerDir, candidate);
    if (existsSync(candidatePath)) {
      htmlPath = candidatePath;
      break;
    }
  }
  if (!htmlPath) {
    const found = existsSync(appServerDir) ? readdirSync(appServerDir) : [];
    throw new Error(
      `Could not find a prerendered HTML file for the "/" route under ${appServerDir}. ` +
        `Directory contents: ${found.join(", ") || "(missing)"}`,
    );
  }
  const html = readFileSync(htmlPath, "utf8");
  const hrefs: string[] = [];
  const linkTagPattern = /<link[^>]+href="([^"]+\.css)"[^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = linkTagPattern.exec(html)) !== null) {
    hrefs.push(match[1]);
  }
  if (hrefs.length === 0) {
    throw new Error(`No <link ...href="*.css"> tags found in the prerendered "/" route HTML at ${htmlPath}.`);
  }
  return hrefs;
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  const tmpRoot = mkdtempSync(join(tmpdir(), "skrewww-smoke-"));
  const consumerDir = join(tmpRoot, "consumer");
  const registryRoot = join(tmpRoot, "registry-serve");
  const registryRDir = join(registryRoot, "r");
  let server: Server | undefined;

  log(`Temp root: ${tmpRoot}`);

  try {
    log("\n[1/13] Building manifests in-memory from the current skrewwwDS working tree (no filesystem writes to the repo)");
    const graph = resolveGraph("button");
    const buttonItem = graph.find((item) => item.name === "button");
    if (!buttonItem) throw new Error("button item missing from resolved graph");
    mkdirSync(registryRDir, { recursive: true });
    for (const item of graph) {
      writeFileSync(join(registryRDir, `${item.name}.json`), JSON.stringify(item, null, 2));
    }
    assert("manifests built for button + foundation", graph.length === 2, `graph: ${graph.map((i) => i.name).join(", ")}`);

    log("\n[2/13] Starting local registry server (loopback-only, dynamic port)");
    const started = await startRegistryServer(registryRoot);
    server = started.server;
    const registryBaseUrl = started.baseUrl;
    log(`  Registry base URL: ${registryBaseUrl}`);

    log("\n[3/13] Readiness check on /r/button.json");
    await waitUntilReady(`${registryBaseUrl}/r/button.json`);
    assert("local registry server ready", true);

    log(`\n[4/13] Scaffolding Tailwind-free consumer (create-next-app@${CREATE_NEXT_APP_VERSION}, pinned)`);
    await run("npx", [
      `create-next-app@${CREATE_NEXT_APP_VERSION}`,
      consumerDir,
      "--typescript",
      "--eslint",
      "--app",
      "--no-tailwind",
      "--no-src-dir",
      "--import-alias",
      "@/*",
      "--use-npm",
      "--yes",
    ]);

    const scaffoldDepNames = readPackageDependencyNames(consumerDir);

    log("\n[5/13] Confirming Tailwind-free scaffold");
    const pkgRaw = readFileSync(join(consumerDir, "package.json"), "utf8");
    assert("no tailwind* dependency in package.json", !/"tailwind/i.test(pkgRaw));
    assert(
      "no tailwind.config.* / postcss.config.*",
      !existsSync(join(consumerDir, "tailwind.config.js")) &&
        !existsSync(join(consumerDir, "tailwind.config.ts")) &&
        !existsSync(join(consumerDir, "postcss.config.js")) &&
        !existsSync(join(consumerDir, "postcss.config.mjs")),
    );
    const globalsCssPath = join(consumerDir, "app", "globals.css");
    assert("no @tailwind directives in app/globals.css", !/@tailwind/.test(readFileSync(globalsCssPath, "utf8")));

    log("\n[6/13] Writing components.json (shadcn init is never invoked — it hard-requires Tailwind; see docs/architecture/shadcn-distribution.md)");
    writeFileSync(
      join(consumerDir, "components.json"),
      JSON.stringify(
        {
          $schema: "https://ui.shadcn.com/schema.json",
          style: "new-york",
          rsc: true,
          tsx: true,
          tailwind: { config: "", css: "app/globals.css", baseColor: "neutral", cssVariables: true },
          aliases: { components: "@/components", utils: "@/lib/utils", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" },
          registries: { "@skrewww": `${registryBaseUrl}/r/{name}.json` },
        },
        null,
        2,
      ),
    );

    log(`\n[7/13] shadcn@${SHADCN_VERSION} view @skrewww/button (before any files are written)`);
    const { stdout: viewOutput } = await run("npx", [`shadcn@${SHADCN_VERSION}`, "view", "@skrewww/button"], {
      cwd: consumerDir,
      captureStdout: true,
    });
    let viewJson: unknown;
    try {
      viewJson = JSON.parse(viewOutput);
    } catch (cause) {
      throw new Error(`shadcn view output did not parse as JSON:\n${viewOutput}`, { cause });
    }
    assert("view resolves to a JSON array with one item", Array.isArray(viewJson) && viewJson.length === 1);
    const viewedItem = (viewJson as ShadcnRegistryItem[])[0];
    assert("view item name is button", viewedItem.name === "button");
    assert(
      "view item declares @skrewww/foundation as a registryDependency",
      viewedItem.registryDependencies.includes("@skrewww/foundation"),
    );

    log("\n[8/13] Pre-add filesystem snapshot");
    const preAddSnapshot = snapshotDir(consumerDir);

    log(`\n[9/13] shadcn@${SHADCN_VERSION} add @skrewww/button`);
    await run("npx", [`shadcn@${SHADCN_VERSION}`, "add", "@skrewww/button", "--yes"], { cwd: consumerDir });

    log("\n[10/13] Post-add filesystem + package.json snapshot, diff, and assertions");
    const postAddSnapshot = snapshotDir(consumerDir);
    const postAddDepNames = readPackageDependencyNames(consumerDir);
    const { added, removed, modified } = diffSnapshots(preAddSnapshot, postAddSnapshot);

    const expectedTargets = new Set(graph.flatMap((item) => item.files.map((f) => targetToRelPath(f.target))));
    const expectedNpmDependencies = new Set(graph.flatMap((item) => item.dependencies));

    const addedExcludingPackageFiles = added.filter((p) => p !== "package.json" && p !== "package-lock.json");
    const unexpectedAdded = addedExcludingPackageFiles.filter((p) => !expectedTargets.has(p));
    assert(
      "every newly-added file matches the recursively derived registry target set",
      unexpectedAdded.length === 0,
      unexpectedAdded.length ? `unexpected: ${unexpectedAdded.join(", ")}` : `${addedExcludingPackageFiles.length} file(s) added, all expected`,
    );
    const missingExpected = Array.from(expectedTargets).filter((t) => !addedExcludingPackageFiles.includes(t));
    assert(
      "every expected registry target file was actually created",
      missingExpected.length === 0,
      missingExpected.length ? `missing: ${missingExpected.join(", ")}` : "all present",
    );

    const criticalPaths = [
      "components/ui/Button.tsx",
      "components/ui/button.module.css",
      "lib/cn.ts",
      "components/ui/icons.tsx",
      "styles/skrewww-foundation.css",
    ];
    for (const criticalPath of criticalPaths) {
      assert(`critical path exists on disk: ${criticalPath}`, existsSync(join(consumerDir, criticalPath)));
    }

    const addedNpmPackages = Array.from(postAddDepNames).filter((name) => !scaffoldDepNames.has(name));
    const unexpectedNpmPackages = addedNpmPackages.filter((name) => !expectedNpmDependencies.has(name));
    const missingNpmPackages = Array.from(expectedNpmDependencies).filter((name) => !addedNpmPackages.includes(name));
    assert(
      "npm dependency delta matches the recursively resolved registry graph's declared dependencies",
      unexpectedNpmPackages.length === 0 && missingNpmPackages.length === 0,
      `expected: [${Array.from(expectedNpmDependencies).join(", ")}], actual new: [${addedNpmPackages.join(", ")}]`,
    );

    const unexplainedRemoved = removed;
    const unexplainedModified = modified.filter((p) => {
      if (p === "package.json" || p === "package-lock.json") {
        return expectedNpmDependencies.size > 0 ? false : true;
      }
      return true;
    });
    const unexpectedChanges = [...unexplainedRemoved.map((p) => `removed:${p}`), ...unexplainedModified.map((p) => `modified:${p}`)];
    assert(
      "no unexplained removed/modified files outside node_modules",
      unexpectedChanges.length === 0,
      unexpectedChanges.length ? unexpectedChanges.join(", ") : "none",
    );

    log("\n[11/13] Wiring Foundation CSS import (before consumer globals.css, exactly once) and rendering a real consumer page");
    const layoutPath = join(consumerDir, "app", "layout.tsx");
    const layoutSrc = readFileSync(layoutPath, "utf8");
    const globalsImportPattern = /import\s+["']\.\/globals\.css["'];/;
    if (!globalsImportPattern.test(layoutSrc)) {
      throw new Error(`Could not find the default \`import "./globals.css";\` line in ${layoutPath} to wire Foundation ahead of it.`);
    }
    const foundationImportLine = 'import "@/styles/skrewww-foundation.css";';
    const wiredLayoutSrc = layoutSrc.replace(globalsImportPattern, (match) => `${foundationImportLine}\n${match}`);
    writeFileSync(layoutPath, wiredLayoutSrc);
    const foundationImportOccurrences = (wiredLayoutSrc.match(new RegExp(escapeRegExp(foundationImportLine), "g")) ?? []).length;
    assert("Foundation CSS import present exactly once", foundationImportOccurrences === 1);
    const foundationIdx = wiredLayoutSrc.indexOf(foundationImportLine);
    const globalsIdx = wiredLayoutSrc.search(globalsImportPattern);
    assert("Foundation CSS import precedes consumer globals.css import", foundationIdx !== -1 && foundationIdx < globalsIdx);

    writeFileSync(
      join(consumerDir, "app", "page.tsx"),
      [
        'import { Button } from "@/components/ui/Button";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", gap: 12 }}>',
        '      <Button variant="primary">Smoke test default</Button>',
        '      <Button variant="primary" disabled>',
        "        Smoke test disabled",
        "      </Button>",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    );
    assert(
      "consumer page imports Button and renders default + disabled instances",
      /from "@\/components\/ui\/Button"/.test(readFileSync(join(consumerDir, "app", "page.tsx"), "utf8")) &&
        /disabled/.test(readFileSync(join(consumerDir, "app", "page.tsx"), "utf8")),
    );

    log("\n[12/13] npm run build");
    await run("npm", ["run", "build"], { cwd: consumerDir });
    assert("next build succeeded", true);

    log("\n[13/13] Foundation CSS activation proof (asset actually referenced by the built \"/\" route)");
    const stylesheetHrefs = findRootRouteStylesheetHrefs(consumerDir);
    let activationConfirmed = false;
    const inspected: string[] = [];
    for (const href of stylesheetHrefs) {
      const cssPath = join(consumerDir, ".next", href.replace(/^\/_next\//, ""));
      if (!existsSync(cssPath)) continue;
      const cssContent = readFileSync(cssPath, "utf8");
      inspected.push(href);
      if (cssContent.includes("--shape-radius-control") || cssContent.includes(".sr-only")) {
        activationConfirmed = true;
        break;
      }
    }
    assert(
      "Foundation CSS signature found in a stylesheet actually referenced by the built \"/\" route",
      activationConfirmed,
      `inspected: ${inspected.join(", ") || "(none resolved on disk)"}`,
    );

    const durationMs = Date.now() - startedAt;
    log(`\nAll assertions passed in ${(durationMs / 1000).toFixed(1)}s.`);
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    if (KEEP) {
      log(`\n--keep passed: preserving temp directory at ${tmpRoot}`);
    } else {
      rmSync(tmpRoot, { recursive: true, force: true });
      log(`\nCleaned up temp directory: ${tmpRoot}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(`\nSmoke test FAILED: ${failures.length ? failures[failures.length - 1] : "(see error below)"}`);
    console.error(error);
    process.exit(1);
  });
