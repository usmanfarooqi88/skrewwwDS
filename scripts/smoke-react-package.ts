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
 */
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "@playwright/test";
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

// ── Consumer fixture ────────────────────────────────────────────────────────

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="data:," />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>skrewww react consumer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const VITE_CONFIG = `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [react()] });
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": false,
    "isolatedModules": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
`;

const MAIN_TSX = `import "@skrewww/react/styles.css";
import { useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormField,
  Link,
  SkrewwwRouterProvider,
  Spinner,
  TextInput,
  ValidationMessage,
} from "@skrewww/react";

declare global {
  interface Window {
    __navigations: string[];
  }
}
window.__navigations = [];

function Examples() {
  const [clicks, setClicks] = useState(0);
  return (
    <main style={{ padding: 24, display: "grid", gap: 16, maxWidth: 560 }}>
      <section aria-label="buttons-and-links" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <Button onClick={() => setClicks((c) => c + 1)}>Action</Button>
        <output aria-label="click count">{clicks}</output>
        <Button href="/from-button" variant="secondary">Button link</Button>
        <Link href="/from-link">Internal link</Link>
        <Link href="https://example.com/out" target="_blank">External link</Link>
        <Link href="/file.txt" download>Download link</Link>
      </section>
      <Card title="Card title" headingLevel="h2">Card body</Card>
      <TextInput label="Email" supportingText="We never share it" />
      <TextInput label="Name" error="Name is required" />
      <FormField label="Custom control" supportingText="Helper text">
        {({ controlId, describedBy, invalid }) => (
          <input id={controlId} aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </FormField>
      <FormField label="Custom invalid control" error="Custom error">
        {({ controlId, describedBy, invalid }) => (
          <input id={controlId} aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </FormField>
      <div data-testid="validation"><ValidationMessage type="error" announce="assertive">Standalone validation</ValidationMessage></div>
      <div data-testid="spinner"><Spinner label="Loading data" /></div>
      <Dialog>
        <DialogTrigger>
          <Button variant="secondary">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <TextInput label="Inside dialog" />
          </DialogBody>
          <DialogFooter>
            <Button>Confirm</Button>
          </DialogFooter>
          <DialogClose />
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Root({ children }: { children: ReactNode }) {
  if (!new URLSearchParams(location.search).has("router")) return <>{children}</>;
  return (
    <SkrewwwRouterProvider
      navigate={(href) => {
        window.__navigations.push(href);
        history.pushState(null, "", href);
      }}
    >
      {children}
    </SkrewwwRouterProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <Root>
    <Examples />
  </Root>,
);
`;

// ── Browser checks ──────────────────────────────────────────────────────────

const TRANSPARENT = "rgba(0, 0, 0, 0)";

async function timeOrigin(page: Page): Promise<number> {
  return page.evaluate(() => performance.timeOrigin);
}

async function buttonSurface(page: Page, name: string) {
  return page.getByRole("button", { name }).first().evaluate((el) => {
    const surface = (el.querySelector("span[aria-hidden='true']") ?? el) as HTMLElement;
    const cs = getComputedStyle(surface);
    return {
      bg: cs.backgroundColor,
      image: cs.backgroundImage,
      radius: cs.borderTopLeftRadius,
      clip: cs.clipPath,
      backdrop: cs.backdropFilter || (cs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter || "",
    };
  });
}

const px = (value: string) => parseFloat(value);

async function browserChecks(baseUrl: string): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
  await context.route("https://example.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<title>external</title>" }),
  );

  try {
    // Button + Link (no provider)
    await page.goto(`${baseUrl}/`);
    await page.getByRole("button", { name: "Action" }).click();
    assert("Button: behavior works (click increments state)", (await page.getByLabel("click count").textContent()) === "1");
    const buttonLink = page.getByRole("link", { name: "Button link" });
    assert("Button href: real anchor", (await buttonLink.evaluate((el) => el.tagName)) === "A" && (await buttonLink.getAttribute("href")) === "/from-button");
    const internal = page.getByRole("link", { name: "Internal link" });
    assert("Link: real anchor with href", (await internal.evaluate((el) => el.tagName)) === "A" && (await internal.getAttribute("href")) === "/from-link");

    const beforeOrigin = await timeOrigin(page);
    await internal.click();
    await page.waitForURL("**/from-link");
    assert("Link without provider: ordinary browser navigation (document reloaded)", (await timeOrigin(page)) !== beforeOrigin);

    // Tokens / styling
    await page.goto(`${baseUrl}/`);
    const surface = await buttonSurface(page, "Action");
    const minHeight = await page.getByRole("button", { name: "Action" }).evaluate((el) => parseFloat(getComputedStyle(el).minHeight));
    assert("Button: tokens resolve (filled surface, control height)", surface.bg !== TRANSPARENT && minHeight >= 32, `bg=${surface.bg} minHeight=${minHeight}`);
    const card = page.getByRole("heading", { name: "Card title" }).locator("xpath=ancestor::*[self::div or self::section or self::article][1]");
    const cardStyle = await card.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { pad: parseFloat(cs.paddingTop), border: parseFloat(cs.borderTopWidth), shadow: cs.boxShadow, bg: cs.backgroundColor };
    });
    assert("Card: expected layout/styling (padding + border or elevation)", cardStyle.pad > 0 || cardStyle.border > 0 || cardStyle.shadow !== "none", JSON.stringify(cardStyle));

    // Text input / form field / validation relationships
    const email = page.getByLabel("Email");
    const emailDescribedBy = (await email.getAttribute("aria-describedby")) ?? "";
    const emailHelp = await page.evaluate((ids) => ids.split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join("|"), emailDescribedBy);
    assert("Text Input: label→input and supporting text→aria-describedby survive packaging", emailHelp.includes("We never share it"), emailHelp);
    const name = page.getByLabel("Name");
    const nameDescribedBy = (await name.getAttribute("aria-describedby")) ?? "";
    const nameError = await page.evaluate((ids) => ids.split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join("|"), nameDescribedBy);
    assert("Text Input: error message is associated and input is aria-invalid", nameError.includes("Name is required") && (await name.getAttribute("aria-invalid")) === "true", nameError);
    const inputHeight = await email.evaluate((el) => parseFloat(getComputedStyle(el).height));
    const inputBorder = await email.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    assert("Text Input: token styling applied (height + border)", inputHeight >= 32 && inputBorder >= 1, `height=${inputHeight} border=${inputBorder}`);
    const custom = page.getByLabel("Custom control");
    const customDescribedBy = (await custom.getAttribute("aria-describedby")) ?? "";
    const customText = await page.evaluate((ids) => ids.split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join("|"), customDescribedBy);
    assert("Form Field: label→control and supporting text wired through aria-describedby", customText.includes("Helper text") && (await custom.getAttribute("aria-invalid")) !== "true", customText);
    const invalidControl = page.getByLabel("Custom invalid control");
    const invalidDescribedBy = (await invalidControl.getAttribute("aria-describedby")) ?? "";
    const invalidText = await page.evaluate((ids) => ids.split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join("|"), invalidDescribedBy);
    assert("Form Field: error is described and control is aria-invalid", invalidText.includes("Custom error") && (await invalidControl.getAttribute("aria-invalid")) === "true", invalidText);
    const validation = page.getByTestId("validation");
    assert("Validation Message: assertive error announces as role=alert", (await validation.textContent())?.includes("Standalone validation") === true && (await validation.locator("[role='alert']").count()) === 1);

    // Spinner
    const spinnerInfo = await page.getByTestId("spinner").evaluate((el) => {
      const animated = [el, ...Array.from(el.querySelectorAll("*"))].map((node) => getComputedStyle(node)).find((cs) => cs.animationName !== "none");
      return { animated: Boolean(animated), name: animated?.animationName, duration: animated?.animationDuration, text: el.textContent };
    });
    assert("Spinner: renders, is labelled and animates", spinnerInfo.animated && (spinnerInfo.text ?? "").includes("Loading data"), JSON.stringify(spinnerInfo));

    // Shape
    const html = page.locator("html");
    for (const [shape, check] of [
      ["sharp", (s: Awaited<ReturnType<typeof buttonSurface>>) => px(s.radius) === 0],
      ["rounded", (s: Awaited<ReturnType<typeof buttonSurface>>) => px(s.radius) > 0 && px(s.radius) < 100],
      ["pill", (s: Awaited<ReturnType<typeof buttonSurface>>) => px(s.radius) >= 999],
      ["squircle", (s: Awaited<ReturnType<typeof buttonSurface>>) => s.clip.startsWith("polygon(")],
    ] as const) {
      await html.evaluate((el, value) => { el.setAttribute("data-skrewww-shape", value); el.setAttribute("data-skrewww-surface", "flat"); }, shape);
      const s = await buttonSurface(page, "Action");
      assert(`Shape ${shape}: computed behavior`, check(s), `radius=${s.radius} clip=${s.clip.slice(0, 20)}`);
    }
    // Surface
    await html.evaluate((el) => el.setAttribute("data-skrewww-shape", "rounded"));
    for (const [surfaceMode, check] of [
      ["flat", (s: Awaited<ReturnType<typeof buttonSurface>>) => s.image === "none" && (s.backdrop === "none" || s.backdrop === "")],
      ["gradient", (s: Awaited<ReturnType<typeof buttonSurface>>) => s.image.includes("gradient(")],
      ["glass", (s: Awaited<ReturnType<typeof buttonSurface>>) => s.backdrop.includes("blur(")],
    ] as const) {
      await html.evaluate((el, value) => el.setAttribute("data-skrewww-surface", value), surfaceMode);
      const s = await buttonSurface(page, "Action");
      assert(`Surface ${surfaceMode}: computed behavior`, check(s), `image=${s.image.slice(0, 24)} backdrop=${s.backdrop}`);
    }

    // Dialog: open, portal, focus, modes reach portal, Escape, close button
    await html.evaluate((el) => { el.setAttribute("data-skrewww-shape", "pill"); el.setAttribute("data-skrewww-surface", "flat"); });
    const trigger = page.getByRole("button", { name: "Open dialog" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    const dialogInfo = await dialog.evaluate((el) => ({
      outsideRoot: !document.getElementById("root")!.contains(el),
      focusInside: el.contains(document.activeElement),
      labelled: Boolean(el.getAttribute("aria-labelledby") ?? el.getAttribute("aria-label")),
    }));
    assert("Dialog: opens and portals outside the app root", dialogInfo.outsideRoot);
    assert("Dialog: focus enters the dialog; it is labelled", dialogInfo.focusInside && dialogInfo.labelled, JSON.stringify(dialogInfo));
    const portaled = await dialog.getByRole("button", { name: "Confirm" }).evaluate((el) => {
      const s = (el.querySelector("span[aria-hidden='true']") ?? el) as HTMLElement;
      return getComputedStyle(s).borderTopLeftRadius;
    });
    assert("Dialog: document-level Shape reaches portaled content (<html> pill)", px(portaled) >= 999, portaled);
    assert("Dialog: input inside is labelled", (await dialog.getByLabel("Inside dialog").count()) === 1);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert("Dialog: Escape closes it and focus returns to the trigger", await trigger.evaluate((el) => el === document.activeElement));
    await trigger.click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: /close/i }).first().click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert("Dialog: close button closes it", true);

    // Optional router provider
    await page.goto(`${baseUrl}/?router=1`);
    await page.evaluate(() => {
      const w = window as unknown as { __defaults: boolean[] };
      w.__defaults = [];
      document.addEventListener("click", (event) => w.__defaults.push(event.defaultPrevented));
    });
    const origin = await timeOrigin(page);
    await page.getByRole("link", { name: "Internal link" }).click();
    await page.waitForURL("**/from-link?router=1").catch(() => page.waitForURL("**/from-link"));
    assert("Router provider: plain internal click calls navigate, no document reload", (await timeOrigin(page)) === origin && (await page.evaluate(() => window.__navigations)).join() === "/from-link");
    await page.goto(`${baseUrl}/?router=1`);
    await page.getByRole("link", { name: "Button link" }).click();
    await page.waitForURL("**/from-button");
    assert("Router provider: Button href also goes through navigate", (await page.evaluate(() => window.__navigations)).join() === "/from-button");

    await page.goto(`${baseUrl}/?router=1`);
    await page.evaluate(() => {
      const w = window as unknown as { __defaults: boolean[] };
      w.__defaults = [];
      document.addEventListener("click", (event) => w.__defaults.push(event.defaultPrevented));
    });
    const popupA = context.waitForEvent("page");
    await page.getByRole("link", { name: "Internal link" }).click({ modifiers: ["ControlOrMeta"] });
    (await popupA).close().catch(() => {});
    const popupB = context.waitForEvent("page");
    await page.getByRole("link", { name: "External link" }).click();
    (await popupB).close().catch(() => {});
    const popupC = context.waitForEvent("download").catch(() => null);
    await page.getByRole("link", { name: "Download link" }).click().catch(() => {});
    await popupC;
    const defaults = await page.evaluate(() => (window as unknown as { __defaults: boolean[] }).__defaults);
    const navs = await page.evaluate(() => window.__navigations);
    assert("Router provider: modified click, target=_blank and download stay native", defaults.every((prevented) => !prevented) && navs.length === 0, `defaultPrevented=${defaults.join()} navigations=${navs.join()}`);

    assert("Console: no runtime errors", consoleErrors.length === 0, consoleErrors.join(" | "));
  } finally {
    await browser.close();
  }
}

// ── Orchestration ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const started = Date.now();
  console.log("[1/6] Build @skrewww/react");
  await buildReactPackage();

  console.log("[2/6] Pack");
  const work = mkdtempSync(join(tmpdir(), "skrewww-react-smoke-"));
  let server: ChildProcess | undefined;
  let failed = false;
  try {
    const dry = JSON.parse(run("npm", ["pack", "--dry-run", "--json"], pkgRoot))[0] as { files: { path: string }[] };
    const packDir = join(work, "pack");
    mkdirSync(packDir);
    const packed = JSON.parse(run("npm", ["pack", "--pack-destination", packDir, "--json"], pkgRoot))[0] as {
      filename: string; size: number; unpackedSize: number; entryCount: number; files: { path: string }[];
    };
    const tarball = join(packDir, packed.filename);
    console.log(`  tarball: ${packed.filename} — ${packed.entryCount} files, ${packed.size} B packed, ${packed.unpackedSize} B unpacked`);
    const paths = packed.files.map((f) => f.path);
    assert("npm pack --dry-run and real pack list the same files", JSON.stringify(dry.files.map((f) => f.path).sort()) === JSON.stringify([...paths].sort()));
    const packIssues = checkPackedFiles(paths);
    assert("Tarball contains only dist/, README, LICENSE, package.json (no app/e2e/evals/.github/docs)", packIssues.length === 0, packIssues.map((i) => i.message).slice(0, 3).join(", "));
    const tarPkg = JSON.parse(run("tar", ["-xOf", tarball, "package/package.json"], work)) as Record<string, unknown>;
    const depNames = Object.keys({ ...(tarPkg.dependencies as object), ...(tarPkg.peerDependencies as object) });
    assert("Packed manifest has no next/recharts/@vercel dependency", !depNames.some((d) => d === "next" || d === "recharts" || d.startsWith("@vercel/")), depNames.join(", "));

    console.log("[3/6] Create clean Vite consumer and install the tarball");
    const app = join(work, "consumer");
    mkdirSync(join(app, "src"), { recursive: true });
    writeFileSync(join(app, "package.json"), JSON.stringify({
      name: "skrewww-react-consumer", private: true, version: "0.0.0", type: "module",
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0", "@skrewww/react": `file:${tarball}` },
      devDependencies: { vite: "^8.0.0", "@vitejs/plugin-react": "^6.0.0", typescript: "^5.9.0", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0" },
    }, null, 2));
    writeFileSync(join(app, "index.html"), INDEX_HTML);
    writeFileSync(join(app, "vite.config.ts"), VITE_CONFIG);
    writeFileSync(join(app, "tsconfig.json"), TSCONFIG);
    writeFileSync(join(app, "src", "main.tsx"), MAIN_TSX);
    run("npm", ["install", "--no-audit", "--no-fund"], app);
    const installed = join(app, "node_modules", "@skrewww", "react");
    assert("Package installs from the tarball (real copy, not a link)", existsSync(join(installed, "dist", "index.js")) && !statSync(installed).isSymbolicLink());
    assert("Consumer has no next installed", !existsSync(join(app, "node_modules", "next")));
    assert("Consumer has no recharts installed", !existsSync(join(app, "node_modules", "recharts")));
    assert("Consumer has no @vercel packages installed", !existsSync(join(app, "node_modules", "@vercel")));
    const consumerPkg = readFileSync(join(app, "package.json"), "utf8");
    assert("Consumer declares no repo alias or source-copy", !/\"@\/|paths|skrewwwDS/.test(consumerPkg + readFileSync(join(app, "tsconfig.json"), "utf8")));
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
    await browserChecks(baseUrl);
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
