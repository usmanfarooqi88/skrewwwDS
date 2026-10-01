/**
 * Make Kit guideline compiler (MK-2B).
 *
 * Pure and deterministic: no filesystem, no network, no Figma, no clock. It
 * turns canonical inputs (Agent contracts, the system contract, authored
 * recipes, the package entry's real public exports, the package manifest and
 * the design-token modes) into a set of guideline files plus a manifest. The
 * only hand-written input is the short environment setup file, which is copied
 * verbatim. Output is a projection of canonical sources — never an authority.
 */
import { createHash } from "node:crypto";
import type { ComponentAgentContract } from "@/lib/agent-kit/contract-schema";
import type { AuthoredRecipe } from "@/lib/agent-kit/recipe-schema";
import { FIGMA_BOUNDARY, SOURCE_PRECEDENCE, STATUS_RULES } from "@/lib/make-kit/policy";
import {
  MAKE_KIT_COMPILER_VERSION,
  MAKE_KIT_MANIFEST_SCHEMA_VERSION,
  MakeKitCompileError,
  type MakeKitFile,
  type MakeKitInput,
  type MakeKitManifest,
  type MakeKitOutput,
} from "@/lib/make-kit/types";

export const GUIDELINES_DIR = "guidelines";
const GENERATED_NOTICE =
  "> Generated from canonical Skrewww metadata by the Make Kit guideline compiler. Do not edit by hand. Not an authority: the registry and the React implementation win.";

const cell = (value: string | undefined): string => (value ?? "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim();
const code = (value: string): string => `\`${value}\``;
const list = (items: string[]): string => items.map((item) => `- ${item}`).join("\n");

function stylesheetSpecifier(input: MakeKitInput): string {
  return `${input.package.name}/styles.css`;
}

// ── Validation ──────────────────────────────────────────────────────────────

/** Terms that would mean a shadcn/Next/docs-app path leaked into npm-facing guidance. */
const FORBIDDEN_CONTENT: Array<{ rule: string; pattern: RegExp }> = [
  { rule: "next/ import path", pattern: /\bnext\/[a-z]/i },
  { rule: "recharts", pattern: /\brecharts\b/i },
  { rule: "@vercel package", pattern: /@vercel\//i },
  { rule: "shadcn install guidance", pattern: /\bshadcn\b/i },
  { rule: "npx command", pattern: /\bnpx\s/i },
  { rule: "repository source path (components/ui)", pattern: /\bcomponents\/ui\b/ },
  { rule: "registry transport path (/r/)", pattern: /(^|[\s(`"'])\/r\/[a-z]/ },
  { rule: "repository alias (@/)", pattern: /(^|[\s(`"'])@\/[a-z]/ },
  { rule: "Figma node id", pattern: /\b\d{3,5}:\d{3,6}\b/ },
];

const SKREWWW_SPECIFIER = /@skrewww\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]*[A-Za-z0-9_-])?/g;

function validateInput(input: MakeKitInput): string[] {
  const issues: string[] = [];
  const { package: pkg } = input;
  if (!pkg.name.startsWith("@") || !pkg.name.includes("/")) issues.push(`package name "${pkg.name}" is not a scoped npm name`);
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version)) issues.push(`package version "${pkg.version}" is not valid semver`);
  if (!("./styles.css" in pkg.exports)) issues.push('package.json exports has no "./styles.css" entry — the stylesheet specifier cannot be derived');
  if (!("." in pkg.exports)) issues.push('package.json exports has no "." entry');
  if (pkg.type !== undefined && pkg.type !== "module") issues.push(`package is not ESM (type=${pkg.type})`);
  for (const peer of ["react", "react-dom"]) {
    if (!pkg.peerDependencies[peer]) issues.push(`package.json peerDependencies is missing ${peer}`);
  }

  const contractsBySlug = new Map(input.contracts.map((contract) => [contract.slug, contract]));
  const seenModules = new Set<string>();
  for (const component of input.components) {
    const contract = contractsBySlug.get(component.slug);
    if (!contract) {
      issues.push(`pilot component "${component.slug}" has no Agent contract`);
      continue;
    }
    if (contract.status !== component.status) {
      issues.push(`status mismatch for "${component.slug}": registry says ${component.status}, Agent contract says ${contract.status}`);
    }
    if (contract.availability.react !== "available") issues.push(`"${component.slug}" is not React-available in its contract`);
    if (!contract.accessibilityLevel) issues.push(`"${component.slug}" contract has no accessibilityLevel`);
    if (!contract.summary) issues.push(`"${component.slug}" contract has no summary`);
    if (!contract.guidance.accessibility) issues.push(`"${component.slug}" contract has no accessibility guidance`);
    if (contract.api.properties.some((prop) => !prop.name || !prop.type)) issues.push(`"${component.slug}" has an API property without a name or type`);
    const exportsForModule = input.exportsByModule[component.module];
    if (!exportsForModule || exportsForModule.values.length === 0) {
      issues.push(`package entry has no public exports for module "${component.module}" (${component.slug})`);
    } else if (!exportsForModule.values.includes(component.module)) {
      issues.push(`package entry does not export "${component.module}" for ${component.slug}`);
    }
    if (seenModules.has(component.module)) issues.push(`module "${component.module}" appears twice in the pilot`);
    seenModules.add(component.module);
    for (const key of Object.keys(contract)) {
      if (/shape|surface/i.test(key)) {
        issues.push(`contract "${component.slug}" now declares ${key}; per-component mode support is no longer unmodeled — update the compiler before generating guidance`);
      }
    }
  }
  if (!input.exportsByModule[input.routerModule]?.values.length) issues.push(`package entry has no public exports for router module "${input.routerModule}"`);

  for (const field of ["principles", "neverInvent", "shapePolicy", "surfacePolicy", "accessibilityBaseline", "namingRules", "tokenPolicy"] as const) {
    if (input.system[field].length === 0) issues.push(`system contract field "${field}" is empty`);
  }
  if (input.modes.shape.length === 0) issues.push("no Shape modes were derived from the token stylesheet");
  if (input.modes.surface.length === 0) issues.push("no Surface modes were derived from the token stylesheet");
  if (!input.manualSetup.trim()) issues.push("manual setup file is empty");
  return issues;
}

function validateOutput(input: MakeKitInput, files: MakeKitFile[]): string[] {
  const issues: string[] = [];
  const stylesheet = stylesheetSpecifier(input);
  const allowed = new Set([input.package.name, stylesheet]);
  const paths = new Set(files.map((file) => file.path));

  for (const file of files) {
    for (const { rule, pattern } of FORBIDDEN_CONTENT) {
      if (pattern.test(file.content)) issues.push(`${file.path}: contains forbidden content (${rule})`);
    }
    for (const specifier of file.content.match(SKREWWW_SPECIFIER) ?? []) {
      if (!allowed.has(specifier)) issues.push(`${file.path}: references "${specifier}", which is not the package or its stylesheet`);
    }
    for (const link of Array.from(file.content.matchAll(/\]\((\.[^)]+\.md)\)/g))) {
      const target = new URL(link[1], `file:///${file.path}`).pathname.slice(1);
      if (!paths.has(target)) issues.push(`${file.path}: links to ${link[1]}, which is not in the kit`);
    }
  }

  const setup = input.manualSetup;
  if (!setup.includes(`import "${stylesheet}";`)) issues.push(`manual setup does not contain the derived stylesheet import: import "${stylesheet}";`);
  for (const topic of ["<html", "data-skrewww-shape", "data-skrewww-surface", "SkrewwwRouterProvider", "portal"]) {
    if (!setup.includes(topic)) issues.push(`manual setup does not cover "${topic}"`);
  }
  if (setup.includes(input.package.version)) issues.push("manual setup hard-codes the package version; the version belongs only in manifest.json");
  if (/\|\s*Prop\s*\|/i.test(setup)) issues.push("manual setup contains a component API table; component facts must come from the generated guidelines");
  for (const contract of input.contracts.filter((c) => input.components.some((component) => component.slug === c.slug))) {
    for (const fact of [contract.summary, contract.guidance.purpose, contract.guidance.whenToUse, contract.guidance.accessibility]) {
      if (fact && fact.length > 24 && setup.includes(fact)) issues.push(`manual setup duplicates a canonical ${contract.slug} fact; remove it`);
    }
  }
  return issues;
}

// ── Rendering ───────────────────────────────────────────────────────────────

function componentGuidelinePath(slug: string): string {
  return `${GUIDELINES_DIR}/components/${slug}.md`;
}

function slugFromHref(href: string): string {
  return href.split("/").filter(Boolean).pop() ?? "";
}

function renderComponent(input: MakeKitInput, contract: ComponentAgentContract, module: string, packageSlugs: Set<string>): string {
  const exportsForModule = input.exportsByModule[module];
  const lines: string[] = [];
  lines.push(`# ${contract.name}`);
  lines.push("");
  lines.push(`Status: **${contract.status}** · Component version ${contract.version} · Accessibility: ${contract.accessibilityLevel}`);
  lines.push("");
  lines.push(GENERATED_NOTICE);
  lines.push("");
  lines.push("## Import");
  lines.push("");
  lines.push("```tsx");
  lines.push(`import { ${exportsForModule.values.join(", ")} } from "${input.package.name}";`);
  lines.push("```");
  lines.push("");
  lines.push(`Public exports: ${exportsForModule.values.map(code).join(", ")}.`);
  if (exportsForModule.types.length > 0) lines.push(`Public types: ${exportsForModule.types.map(code).join(", ")}.`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push(contract.summary);
  lines.push("");
  lines.push(contract.guidance.purpose);
  lines.push("");
  lines.push("## When to use");
  lines.push("");
  lines.push(contract.guidance.whenToUse);
  lines.push("");
  lines.push("## When not to use");
  lines.push("");
  lines.push(contract.guidance.whenNotToUse);
  lines.push("");
  lines.push("## Common mistakes");
  lines.push("");
  lines.push(contract.guidance.commonMistakes);
  lines.push("");
  lines.push("## Accessibility");
  lines.push("");
  lines.push(contract.guidance.accessibility);
  const behavior = contract.behavior;
  if (behavior) {
    lines.push("");
    for (const [label, key] of [["Keyboard", "keyboard"], ["Focus", "focus"], ["Dismissal", "dismissal"], ["Motion", "motion"], ["Announcement", "announcement"]] as const) {
      if (behavior[key]) lines.push(`- **${label}:** ${behavior[key]}`);
    }
  }
  lines.push("");
  lines.push(`## API for ${code(module)}`);
  lines.push("");
  if (contract.api.properties.length === 0) {
    lines.push("The contract declares no props for this component.");
  } else {
    lines.push("| Prop | Type | Default | Description |");
    lines.push("|---|---|---|---|");
    for (const prop of contract.api.properties) {
      lines.push(`| ${code(prop.name)} | ${cell(prop.type)} | ${cell(prop.default)} | ${cell(prop.description)} |`);
    }
  }
  if (contract.api.variants.length > 0) lines.push("", `Variant values: ${contract.api.variants.map(code).join(", ")}.`);
  if (contract.api.sizes.length > 0) lines.push("", `Size values: ${contract.api.sizes.map(code).join(", ")}.`);
  lines.push("");
  lines.push("The table is the declared API from the Agent contract, copied verbatim. Do not invent props that are not listed; variant and size values apply only to a prop that is itself listed.");
  const otherExports = exportsForModule.values.filter((name) => name !== module);
  if (otherExports.length > 0) {
    lines.push("");
    lines.push(`Other public exports: ${otherExports.map(code).join(", ")}. Their props are not individually modeled in the Agent contract (any related entries appear in the table above exactly as the contract records them). Read the package's type declarations and do not invent props for them.`);
  }
  const related = contract.relatedComponents.filter((link) => packageSlugs.has(slugFromHref(link.href)));
  if (related.length > 0) {
    lines.push("");
    lines.push("## Related components in this package");
    lines.push("");
    for (const link of related) {
      const [name, ...rest] = link.label.split(" — ");
      lines.push(`- [${name}](./${slugFromHref(link.href)}.md)${rest.length > 0 ? ` — ${rest.join(" — ")}` : ""}`);
    }
  }
  lines.push("");
  lines.push("## Tokens used");
  lines.push("");
  lines.push(contract.tokens.used.length > 0 ? contract.tokens.used.map(code).join(", ") : "None recorded.");
  lines.push("");
  lines.push("## Shape and Surface");
  lines.push("");
  lines.push("The component contract does not declare per-component Shape or Surface support. Do not assume it from appearance; see ../system.md.");
  lines.push("");
  lines.push("## Figma reference");
  lines.push("");
  lines.push(
    `Figma component: ${contract.availability.figma}${contract.figma.verified ? "; a verified Figma reference is recorded" : "; no verified Figma reference is recorded"}. Reference only — React owns runtime API and semantics.`,
  );
  if (contract.guidance.knownLimitation) {
    lines.push("", "## Known limitation", "", contract.guidance.knownLimitation);
  }
  return `${lines.join("\n")}\n`;
}

function renderSystem(input: MakeKitInput): string {
  const nameOf = (slug: string) => input.contracts.find((c) => c.slug === slug)?.name ?? slug;
  const statusCensus = (status: string) => input.components.filter((component) => component.status === status).map((component) => nameOf(component.slug));
  const lines: string[] = [];
  lines.push("# Skrewww system guidelines", "", GENERATED_NOTICE, "");
  lines.push("## Source precedence", "", "_Authored policy; each line restates a canonical document._", "");
  lines.push(list(SOURCE_PRECEDENCE.map((statement) => statement.text)), "");
  lines.push("## Component status", "", list(STATUS_RULES.map((statement) => statement.text)), "");
  const stable = statusCensus("stable");
  const beta = statusCensus("beta");
  lines.push(`In ${code(`${input.package.name}@${input.package.version}`)}: stable — ${stable.length > 0 ? stable.join(", ") : "none"}; beta — ${beta.length > 0 ? beta.join(", ") : "none"}.`, "");
  lines.push("## Principles (system contract)", "", list(input.system.principles), "");
  lines.push("## Never invent (system contract)", "", list(input.system.neverInvent), "");
  lines.push("## Naming (system contract)", "", list(input.system.namingRules), "");
  lines.push("## Tokens (system contract)", "", list(input.system.tokenPolicy), "");
  lines.push("## Shape and Surface", "");
  lines.push("_Modes derived from the design-token stylesheet; policy from the system contract._", "");
  lines.push(`- Shape attribute: ${code("data-skrewww-shape")}. Allowed values: ${input.modes.shape.map(code).join(", ")}.`);
  lines.push(`- Surface attribute: ${code("data-skrewww-surface")}. Allowed values: ${input.modes.surface.map(code).join(", ")}.`);
  lines.push("- Modes are set at document level; see ./setup.md for placement.");
  lines.push("- The component contracts in this package do not declare per-component Shape or Surface support.", "");
  lines.push(list(input.system.shapePolicy), "", list(input.system.surfacePolicy), "");
  lines.push("## Figma boundary", "", list(FIGMA_BOUNDARY.map((statement) => statement.text)), "");
  return `${lines.join("\n")}\n`;
}

function renderAccessibility(input: MakeKitInput, recipes: AuthoredRecipe[]): string {
  const levels = Array.from(new Set(input.contracts.filter((c) => input.components.some((p) => p.slug === c.slug)).map((c) => c.accessibilityLevel))).sort();
  const lines: string[] = [];
  lines.push("# Accessibility guidelines", "", GENERATED_NOTICE, "");
  lines.push("## Target", "", `Accessibility level recorded for the components in this package: ${levels.join("; ")}.`, "");
  lines.push("## Baseline (system contract)", "", list(input.system.accessibilityBaseline), "");
  lines.push(
    "## Per-component accessibility",
    "",
    "Each component guideline carries its own Accessibility section and, where recorded, keyboard, focus, dismissal and announcement behavior:",
    "",
    list(input.components.map((component) => `[${input.contracts.find((c) => c.slug === component.slug)?.name ?? component.slug}](./components/${component.slug}.md)`)),
    "",
  );
  for (const recipe of recipes) {
    lines.push(`## Composition-level notes: ${recipe.title}`, "", `_From recipe ${code(recipe.id)} (recipe status: ${recipe.status})._`, "", list(recipe.accessibilityNotes), "");
  }
  return `${lines.join("\n")}\n`;
}

function renderComposition(input: MakeKitInput, recipes: AuthoredRecipe[]): string {
  const bySlug = new Map(input.components.map((component) => [component.slug, component]));
  const lines: string[] = [];
  lines.push("# Composition guidelines", "", GENERATED_NOTICE, "");
  lines.push("Only compositions whose required components are all in this package are included. Accessibility notes for each composition are in ./accessibility.md.", "");
  if (recipes.length === 0) lines.push("No recipe is fully covered by this package.", "");
  for (const recipe of recipes) {
    lines.push(`## ${recipe.title}`, "", `Recipe ${code(recipe.id)} · recipe status: ${recipe.status} · version ${recipe.version}`, "", recipe.summary, "", `Goal: ${recipe.goal}`, "");
    const required = recipe.requiredComponents.map((slug) => `[${input.contracts.find((c) => c.slug === slug)?.name ?? slug}](./components/${slug}.md) (${bySlug.get(slug)?.status})`);
    lines.push(`Required components: ${required.join(", ")}.`, "");
    lines.push("When to use:", "", list(recipe.whenToUse), "", "When not to use:", "", list(recipe.whenNotToUse), "");
    lines.push("Workflow:", "");
    recipe.workflow.forEach((step, index) => {
      lines.push(`${index + 1}. **${step.intent}** ${step.guidance}`);
      const refs = (step.apiReferences ?? []).map((ref) => code(`${ref.component}.${ref.property}${ref.value ? `=${ref.value}` : ""}`));
      if (refs.length > 0) lines.push(`   Props referenced: ${refs.join(", ")}.`);
    });
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderOverview(input: MakeKitInput, recipes: AuthoredRecipe[]): string {
  const lines: string[] = [];
  lines.push("# Skrewww guidelines", "", GENERATED_NOTICE, "");
  lines.push(`Package: ${code(input.package.name)} · generated for version ${code(input.package.version)} · see manifest.json for the machine-readable surface.`, "");
  lines.push("Read in this order:", "");
  lines.push("1. [setup.md](./setup.md) — **hand-written** environment setup (the only manual file in this kit).");
  lines.push("2. [system.md](./system.md) — source precedence, status rules, Shape and Surface, Figma boundary (generated).");
  lines.push("3. [accessibility.md](./accessibility.md) — accessibility target and baseline (generated).");
  lines.push(`4. [composition.md](./composition.md) — ${recipes.length} composition(s) fully covered by this package (generated).`);
  lines.push("5. One guideline per component (generated):", "");
  lines.push("| Component | Status | Import |", "|---|---|---|");
  for (const component of input.components) {
    const contract = input.contracts.find((c) => c.slug === component.slug)!;
    lines.push(`| [${contract.name}](./components/${component.slug}.md) | ${component.status} | ${code(`import { ${component.module} } from "${input.package.name}"`)} |`);
  }
  lines.push("", "Components not listed here are not in this package. Do not import or invent them.");
  return `${lines.join("\n")}\n`;
}

// ── Compile ─────────────────────────────────────────────────────────────────

/** Recipes whose every required/optional component is in the package. */
function packageRecipes(input: MakeKitInput): AuthoredRecipe[] {
  const slugs = new Set(input.components.map((component) => component.slug));
  return input.recipes
    .filter((recipe) => [...recipe.requiredComponents, ...(recipe.optionalComponents ?? [])].every((slug) => slugs.has(slug)))
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function compileMakeKit(input: MakeKitInput): MakeKitOutput {
  const inputIssues = validateInput(input);
  if (inputIssues.length > 0) throw new MakeKitCompileError(inputIssues);

  const packageSlugs = new Set(input.components.map((component) => component.slug));
  const recipes = packageRecipes(input);
  const stylesheet = stylesheetSpecifier(input);

  const generated: MakeKitFile[] = [
    { path: `${GUIDELINES_DIR}/Guidelines.md`, content: renderOverview(input, recipes) },
    { path: `${GUIDELINES_DIR}/system.md`, content: renderSystem(input) },
    { path: `${GUIDELINES_DIR}/accessibility.md`, content: renderAccessibility(input, recipes) },
    { path: `${GUIDELINES_DIR}/composition.md`, content: renderComposition(input, recipes) },
    ...input.components.map((component) => ({
      path: componentGuidelinePath(component.slug),
      content: renderComponent(input, input.contracts.find((c) => c.slug === component.slug)!, component.module, packageSlugs),
    })),
  ];
  const manual: MakeKitFile = { path: `${GUIDELINES_DIR}/setup.md`, content: input.manualSetup.endsWith("\n") ? input.manualSetup : `${input.manualSetup}\n` };
  const guidelineFiles = [...generated, manual].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const outputIssues = validateOutput(input, guidelineFiles);
  if (outputIssues.length > 0) throw new MakeKitCompileError(outputIssues);

  const digest = createHash("sha256");
  for (const file of guidelineFiles) digest.update(`${file.path}\0${file.content}\n`);

  const exportIndex: Record<string, string> = {};
  const components = input.components.map((component) => {
    const contract = input.contracts.find((c) => c.slug === component.slug)!;
    const exportsForModule = input.exportsByModule[component.module];
    for (const name of exportsForModule.values) exportIndex[name] = input.package.name;
    return {
      slug: component.slug,
      name: contract.name,
      status: component.status,
      componentVersion: contract.version,
      guideline: componentGuidelinePath(component.slug),
      exports: exportsForModule,
    };
  });
  const routerExports = input.exportsByModule[input.routerModule];
  for (const name of routerExports.values) exportIndex[name] = input.package.name;

  const manifest: MakeKitManifest = {
    schemaVersion: MAKE_KIT_MANIFEST_SCHEMA_VERSION,
    compilerVersion: MAKE_KIT_COMPILER_VERSION,
    package: {
      name: input.package.name,
      version: input.package.version,
      entry: input.package.name,
      stylesheet,
      moduleFormat: "esm",
      peerDependencies: Object.fromEntries(Object.entries(input.package.peerDependencies).sort(([a], [b]) => (a < b ? -1 : 1))),
    },
    modes: {
      shape: input.modes.shape,
      surface: input.modes.surface,
      attributes: { shape: "data-skrewww-shape", surface: "data-skrewww-surface" },
    },
    components,
    utilities: [{ name: "SkrewwwRouterProvider", guideline: `${GUIDELINES_DIR}/setup.md`, exports: routerExports }],
    exportIndex: Object.fromEntries(Object.entries(exportIndex).sort(([a], [b]) => (a < b ? -1 : 1))),
    guidelines: {
      generated: generated.map((file) => file.path).sort(),
      manual: [manual.path],
    },
    recipes: recipes.map((recipe) => ({ id: recipe.id, status: recipe.status, guideline: `${GUIDELINES_DIR}/composition.md` })),
    sources: input.sources,
    authority: { isAuthority: false, figmaReferencesAreReferenceOnly: true, figmaSnapshotsIncluded: false, liveFigmaRequired: false },
    provenance: {
      sourceGitSha: input.provenance.sourceGitSha,
      sourceGitCommitTimestamp: input.provenance.sourceGitCommitTimestamp,
      guidelinesDigest: digest.digest("hex"),
    },
  };

  const files = [...guidelineFiles, { path: "manifest.json", content: `${JSON.stringify(manifest, null, 2)}\n` }];
  return { files, manifest };
}
