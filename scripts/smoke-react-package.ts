/**
 * Clean-Vite consumer proof for the @skrewww/react package candidate (MK-1).
 *
 *   npm run smoke:react-package
 *
 * Builds the package, packs a real tarball, installs ONLY that tarball (plus
 * React and build tooling — never next/recharts) into a brand-new Vite app in
 * os.tmpdir(), typechecks it, production-builds it, then drives the built app
 * in real Chromium to verify rendering, tokens, Shape/Surface modes, Dialog
 * portal/focus/Escape and the optional router provider. Nothing is published.
 *
 * Same philosophy as `smoke:consumer` (fresh consumer, real tooling, real
 * build) but for the npm-library distribution model, not the shadcn one.
 * Requires network access for `npm install`, like smoke:consumer.
 *
 * `npm run smoke:react-package -- --from-registry <version-or-tag>` runs the same
 * consumer proof against the package as published on public npm (no build, no
 * local tarball): used to verify a real release, e.g. `--from-registry 0.1.0-beta.1`.
 */
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INDEX_HTML, MAIN_TSX, TSCONFIG, VITE_CONFIG, runReactPackageBrowserChecks } from "../lib/consumer-scenarios/react-package-scenario";
import { buildReactPackage } from "./build-react-package";
import { checkBuiltFile } from "../lib/react-package/output-checks";
import { checkPackedFiles } from "../lib/react-package/release-checks";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgRoot = join(root, "packages", "react");

type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];
function record(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "✔" : "✖"} ${name}${detail ? ` — ${detail}` : ""}`);
}
function assert(name: string, condition: boolean, detail?: string): void {
  record(name, condition, detail);
}

function run(cmd: string, args: string[], cwd: string): string {
  try {
    return execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; message: string };
    throw new Error(`${cmd} ${args.join(" ")} failed in ${cwd}\n${e.stdout ?? ""}\n${e.stderr ?? ""}`);
  }
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

// ── Orchestration ───────────────────────────────────────────────────────────

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const started = Date.now();
  const registrySpec = argValue("--from-registry");
  if (registrySpec) {
    console.log(`[1/6] Skipped (registry mode): consuming @skrewww/react@${registrySpec} from public npm`);
  } else {
    console.log("[1/6] Build @skrewww/react");
    await buildReactPackage();
  }

  console.log(registrySpec ? "[2/6] Skipped (registry mode): no local pack" : "[2/6] Pack");
  const work = mkdtempSync(join(tmpdir(), "skrewww-react-smoke-"));
  let server: ChildProcess | undefined;
  let failed = false;
  try {
    let tarball = "";
    if (!registrySpec) {
      const dry = JSON.parse(run("npm", ["pack", "--dry-run", "--json"], pkgRoot))[0] as { files: { path: string }[] };
      const packDir = join(work, "pack");
      mkdirSync(packDir);
      const packed = JSON.parse(run("npm", ["pack", "--pack-destination", packDir, "--json"], pkgRoot))[0] as {
        filename: string; size: number; unpackedSize: number; entryCount: number; files: { path: string }[];
      };
      tarball = join(packDir, packed.filename);
      console.log(`  tarball: ${packed.filename} — ${packed.entryCount} files, ${packed.size} B packed, ${packed.unpackedSize} B unpacked`);
      const paths = packed.files.map((f) => f.path);
      assert("npm pack --dry-run and real pack list the same files", JSON.stringify(dry.files.map((f) => f.path).sort()) === JSON.stringify([...paths].sort()));
      const packIssues = checkPackedFiles(paths);
      assert("Tarball contains only dist/, README, LICENSE, package.json (no app/e2e/evals/.github/docs)", packIssues.length === 0, packIssues.map((i) => i.message).slice(0, 3).join(", "));
      const tarPkg = JSON.parse(run("tar", ["-xOf", tarball, "package/package.json"], work)) as Record<string, unknown>;
      const depNames = Object.keys({ ...(tarPkg.dependencies as object), ...(tarPkg.peerDependencies as object) });
      assert("Packed manifest has no next/recharts/@vercel dependency", !depNames.some((d) => d === "next" || d === "recharts" || d.startsWith("@vercel/")), depNames.join(", "));
    }

    console.log(registrySpec ? "[3/6] Create clean Vite consumer and install from public npm" : "[3/6] Create clean Vite consumer and install the tarball");
    const app = join(work, "consumer");
    mkdirSync(join(app, "src"), { recursive: true });
    writeFileSync(join(app, "package.json"), JSON.stringify({
      name: "skrewww-react-consumer", private: true, version: "0.0.0", type: "module",
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0", "@skrewww/react": registrySpec ?? `file:${tarball}` },
      devDependencies: { vite: "^8.0.0", "@vitejs/plugin-react": "^6.0.0", typescript: "^5.9.0", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0" },
    }, null, 2));
    writeFileSync(join(app, "index.html"), INDEX_HTML);
    writeFileSync(join(app, "vite.config.ts"), VITE_CONFIG);
    writeFileSync(join(app, "tsconfig.json"), TSCONFIG);
    writeFileSync(join(app, "src", "main.tsx"), MAIN_TSX);
    run("npm", ["install", "--no-audit", "--no-fund"], app);
    const installed = join(app, "node_modules", "@skrewww", "react");
    assert("Package installs (real copy, not a link)", existsSync(join(installed, "dist", "index.js")) && !statSync(installed).isSymbolicLink());
    if (registrySpec) {
      const lock = JSON.parse(readFileSync(join(app, "package-lock.json"), "utf8")) as { packages: Record<string, { version?: string; resolved?: string; integrity?: string }> };
      const entry = lock.packages["node_modules/@skrewww/react"];
      const installedVersion = (JSON.parse(readFileSync(join(installed, "package.json"), "utf8")) as { version: string }).version;
      console.log(`  installed @skrewww/react@${installedVersion} from ${entry?.resolved}`);
      assert("Installed from the public npm registry (not a tarball, path or git)", Boolean(entry?.resolved?.startsWith("https://registry.npmjs.org/@skrewww/react/-/")) && Boolean(entry?.integrity));
      assert(`Installed version matches the requested spec${/^\d/.test(registrySpec) ? " exactly" : " (tag)"}`, /^\d/.test(registrySpec) ? installedVersion === registrySpec : Boolean(installedVersion), installedVersion);
    }
    assert("Consumer has no next installed", !existsSync(join(app, "node_modules", "next")));
    assert("Consumer has no recharts installed", !existsSync(join(app, "node_modules", "recharts")));
    assert("Consumer has no @vercel packages installed", !existsSync(join(app, "node_modules", "@vercel")));
    const consumerPkg = readFileSync(join(app, "package.json"), "utf8");
    assert("Consumer declares no repo alias, link or source-copy", !(registrySpec ? /\"@\/|paths|skrewwwDS|file:|link:|workspace:/ : /\"@\/|paths|skrewwwDS/).test(consumerPkg + readFileSync(join(app, "tsconfig.json"), "utf8")));
    const distViolations = walk(join(installed, "dist")).flatMap((f) => checkBuiltFile(f.slice(installed.length + 1), readFileSync(f, "utf8")));
    assert("Installed package: no next/recharts/@vercel/@ alias in JS or declarations", distViolations.length === 0, distViolations.map((v) => `${v.file}:${v.rule}`).join(", "));

    console.log("[4/6] Typecheck the consumer");
    run(join(app, "node_modules", ".bin", "tsc"), ["--noEmit"], app);
    record("TypeScript passes (strict, skipLibCheck off, no path mapping)", true);

    console.log("[5/6] Production build");
    run(join(app, "node_modules", ".bin", "vite"), ["build"], app);
    record("Vite production build passes", true);
    const assets = walk(join(app, "dist", "assets"));
    const bundleText = assets.filter((f) => f.endsWith(".js")).map((f) => readFileSync(f, "utf8")).join("\n");
    assert("Consumer bundle contains no next or recharts code", !/recharts|next\/dist|next\/link|__NEXT_DATA__/i.test(bundleText));

    console.log("[6/6] Real-browser verification");
    const port = await freePort();
    server = spawn(join(app, "node_modules", ".bin", "vite"), ["preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: app, stdio: "ignore" });
    const baseUrl = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 50; i++) {
      try { if ((await fetch(baseUrl)).ok) break; } catch { /* not up yet */ }
      await new Promise((r) => setTimeout(r, 200));
    }
    await runReactPackageBrowserChecks(baseUrl, assert);
  } catch (error) {
    failed = true;
    console.error(error instanceof Error ? error.message : error);
  } finally {
    server?.kill();
    if (!failed && results.every((r) => r.ok)) rmSync(work, { recursive: true, force: true });
    else console.log(`Workspace kept for inspection: ${work}`);
  }

  const failures = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failures.length}/${results.length} checks passed in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  if (failed || failures.length > 0) {
    for (const f of failures) console.error(`  ✖ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
    process.exit(1);
  }
  console.log("All assertions passed. Nothing was published.");
}

main();
