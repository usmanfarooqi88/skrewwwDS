import { CCV_ID_PATTERN } from "@/lib/ccv/ids";
import { isCcvFailureCode } from "@/lib/ccv/failure-codes";
import {
  CCV_AUTHORITIES,
  CCV_CONTRACT_SCHEMA_VERSION,
  CCV_DISTRIBUTIONS,
  CCV_EVIDENCE_KINDS,
  CCV_EVIDENCE_OBSERVED_LIMIT,
  CCV_MODES,
  CCV_MODES_BY_DISTRIBUTION,
  CCV_RESULT_SCHEMA_VERSION,
  type CcvCheck,
  type CcvResult,
} from "@/lib/ccv/types";

/**
 * CCV-1 — strict runtime validation of the two schemas. Invalid data is
 * REJECTED with every problem listed, never sanitized or repaired: a contract
 * or result that needs fixing up is not evidence.
 */

export type CcvValidation = { ok: true } | { ok: false; problems: string[] };

const SHA256 = /^[0-9a-f]{64}$/;
const GIT_SHA = /^[0-9a-f]{40}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const INTEGRITY = /^sha(?:256|384|512)-[A-Za-z0-9+/]+={0,2}$/;
const CHECK_STATUSES = ["pass", "fail", "unknown", "not-applicable"] as const;
const FILE_KINDS = ["own", "internal", "foundation"] as const;
const FILE_TYPES = ["registry:ui", "registry:lib", "registry:file"] as const;

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isNonEmptyString = (value: unknown): value is string => isString(value) && value.trim().length > 0;

class Problems {
  readonly list: string[] = [];
  add(path: string, message: string): void {
    this.list.push(`${path}: ${message}`);
  }
  keys(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
    for (const key of Object.keys(value)) if (!allowed.includes(key)) this.add(`${path}.${key}`, "unknown field");
  }
  stringList(value: unknown, path: string, options: { unique?: boolean; nonEmpty?: boolean } = {}): string[] {
    if (!Array.isArray(value) || !value.every(isString)) {
      this.add(path, "must be a list of strings");
      return [];
    }
    const list = value as string[];
    if (options.nonEmpty && list.some((entry) => entry.length === 0)) this.add(path, "contains an empty string");
    if (options.unique !== false) {
      const seen = new Set<string>();
      for (const entry of list) {
        if (seen.has(entry)) this.add(path, `duplicate entry "${entry}"`);
        seen.add(entry);
      }
    }
    return list;
  }
  result(): CcvValidation {
    return this.list.length === 0 ? { ok: true } : { ok: false, problems: this.list };
  }
}

function validateCssSurface(value: unknown, path: string, p: Problems, listExtras: readonly string[], stringExtras: readonly string[] = []): void {
  if (!isObject(value)) return p.add(path, "must be an object");
  const lists = ["declaredCustomProperties", "usedCustomProperties", "unresolvedWithoutFallback", "fallbackBackedUses", "modeSelectors", ...listExtras];
  p.keys(value, [...lists, ...stringExtras], path);
  for (const key of lists) p.stringList(value[key], `${path}.${key}`);
  for (const key of stringExtras) if (!isNonEmptyString(value[key])) p.add(`${path}.${key}`, "must be a non-empty string");
  const unresolved = Array.isArray(value.unresolvedWithoutFallback) ? (value.unresolvedWithoutFallback as string[]) : [];
  const fallback = Array.isArray(value.fallbackBackedUses) ? (value.fallbackBackedUses as string[]) : [];
  const declared = Array.isArray(value.declaredCustomProperties) ? (value.declaredCustomProperties as string[]) : [];
  for (const name of unresolved) if (fallback.includes(name)) p.add(path, `"${name}" cannot be both unresolved and fallback-backed`);
  for (const name of [...unresolved, ...fallback]) if (declared.includes(name)) p.add(path, `"${name}" is declared, so it cannot be unresolved or fallback-backed`);
}

function validateAuthorities(value: unknown, keys: readonly string[], path: string, p: Problems): void {
  if (!isObject(value)) return p.add(path, "must be an object");
  p.keys(value, keys, path);
  for (const key of keys) {
    if (!(CCV_AUTHORITIES as readonly string[]).includes(value[key] as string)) p.add(`${path}.${key}`, "must be a known authority");
  }
}

export function validateConsumerContract(input: unknown): CcvValidation {
  const p = new Problems();
  if (!isObject(input)) return { ok: false, problems: ["contract: must be an object"] };
  p.keys(input, ["schemaVersion", "distribution", "mode", "subject", "source", "tools", "expectations"], "contract");
  if (input.schemaVersion !== CCV_CONTRACT_SCHEMA_VERSION) p.add("schemaVersion", `unsupported (expected ${CCV_CONTRACT_SCHEMA_VERSION})`);
  const distribution = input.distribution;
  const knownDistribution = (CCV_DISTRIBUTIONS as readonly string[]).includes(distribution as string);
  if (!knownDistribution) p.add("distribution", "unknown distribution");
  const knownMode = (CCV_MODES as readonly string[]).includes(input.mode as string);
  if (!knownMode) p.add("mode", "invalid mode");
  if (knownDistribution && knownMode && !CCV_MODES_BY_DISTRIBUTION[distribution as "shadcn-registry" | "npm-package"].includes(input.mode as never)) {
    p.add("mode", `${String(input.mode)} cannot verify ${String(distribution)}`);
  }
  if (!isNonEmptyString(input.subject)) p.add("subject", "must be a non-empty string");

  const source = input.source;
  if (!isObject(source)) p.add("source", "must be an object");
  else {
    p.keys(source, ["gitSha", "packageVersion", "registryOrigin"], "source");
    if (!isString(source.gitSha) || !GIT_SHA.test(source.gitSha)) p.add("source.gitSha", "must be a 40-hex git SHA");
    if (source.packageVersion !== undefined && (!isString(source.packageVersion) || !SEMVER.test(source.packageVersion))) p.add("source.packageVersion", "must be semver");
    if (source.registryOrigin !== undefined && (!isString(source.registryOrigin) || !/^https?:\/\//.test(source.registryOrigin))) p.add("source.registryOrigin", "must be an http(s) origin");
    if (distribution === "npm-package" && source.packageVersion === undefined) p.add("source.packageVersion", "required for an npm contract");
  }
  if (input.tools !== undefined) {
    if (!isObject(input.tools) || !Object.values(input.tools).every(isNonEmptyString)) p.add("tools", "must map tool names to version strings");
  }

  const e = input.expectations;
  if (!isObject(e)) {
    p.add("expectations", "must be an object");
    return p.result();
  }
  if (distribution === "shadcn-registry") validateShadcnExpectations(e, p);
  else if (distribution === "npm-package") validateNpmExpectations(e, p);
  return p.result();
}

function validateShadcnExpectations(e: Record<string, unknown>, p: Problems): void {
  p.keys(e, ["item", "manifest", "files", "dependencies", "hostRequirements", "closure", "exports", "css", "authorities"], "expectations");
  if (!isObject(e.item) || !isNonEmptyString(e.item.name) || !(FILE_TYPES as readonly string[]).includes(e.item.type as string)) p.add("expectations.item", "needs a name and a registry item type");
  if (!isObject(e.manifest)) p.add("expectations.manifest", "must be an object");
  else {
    p.stringList(e.manifest.keys, "expectations.manifest.keys");
    p.stringList(e.manifest.fileEntryKeys, "expectations.manifest.fileEntryKeys");
  }
  if (!Array.isArray(e.files)) p.add("expectations.files", "must be a list");
  else {
    const targets = new Set<string>();
    const installPaths = new Set<string>();
    e.files.forEach((file: unknown, index: number) => {
      const path = `expectations.files[${index}]`;
      if (!isObject(file)) return p.add(path, "must be an object");
      p.keys(file, ["target", "installPath", "sourcePath", "sha256", "bytes", "kind", "fileType", "originMarker"], path);
      if (!isNonEmptyString(file.target) || !file.target.startsWith("~/")) p.add(`${path}.target`, 'must be a "~/"-rooted target');
      if (!isNonEmptyString(file.installPath)) p.add(`${path}.installPath`, "must be a non-empty string");
      else if (isString(file.target) && file.target !== `~/${file.installPath}`) p.add(`${path}.installPath`, "does not match the target");
      if (!isNonEmptyString(file.sourcePath)) p.add(`${path}.sourcePath`, "must be a non-empty string");
      if (!isString(file.sha256) || !SHA256.test(file.sha256)) p.add(`${path}.sha256`, "malformed SHA-256");
      if (!Number.isInteger(file.bytes) || (file.bytes as number) < 0) p.add(`${path}.bytes`, "must be a non-negative integer");
      if (!(FILE_KINDS as readonly string[]).includes(file.kind as string)) p.add(`${path}.kind`, "must be own, internal or foundation");
      if (!(FILE_TYPES as readonly string[]).includes(file.fileType as string)) p.add(`${path}.fileType`, "unknown registry file type");
      if (file.originMarker !== undefined && !isNonEmptyString(file.originMarker)) p.add(`${path}.originMarker`, "must be a non-empty slug");
      if (isString(file.target)) {
        if (targets.has(file.target)) p.add(`${path}.target`, `duplicate file target "${file.target}"`);
        targets.add(file.target);
      }
      if (isString(file.installPath)) {
        if (installPaths.has(file.installPath)) p.add(`${path}.installPath`, `duplicate install path "${file.installPath}"`);
        installPaths.add(file.installPath);
      }
    });
  }
  if (!isObject(e.dependencies)) p.add("expectations.dependencies", "must be an object");
  else {
    p.keys(e.dependencies, ["npm", "registry"], "expectations.dependencies");
    p.stringList(e.dependencies.npm, "expectations.dependencies.npm");
    p.stringList(e.dependencies.registry, "expectations.dependencies.registry");
  }
  p.stringList(e.hostRequirements, "expectations.hostRequirements");
  if (!isObject(e.closure)) p.add("expectations.closure", "must be an object");
  else {
    p.keys(e.closure, ["items", "npm", "installPaths", "sharedTargets"], "expectations.closure");
    p.stringList(e.closure.items, "expectations.closure.items");
    p.stringList(e.closure.npm, "expectations.closure.npm");
    p.stringList(e.closure.installPaths, "expectations.closure.installPaths");
    if (!Array.isArray(e.closure.sharedTargets)) p.add("expectations.closure.sharedTargets", "must be a list");
    else {
      const seen = new Set<string>();
      e.closure.sharedTargets.forEach((shared: unknown, index: number) => {
        const path = `expectations.closure.sharedTargets[${index}]`;
        if (!isObject(shared) || !isNonEmptyString(shared.installPath)) return p.add(path, "needs an installPath");
        if (seen.has(shared.installPath)) p.add(path, `duplicate shared target "${shared.installPath}"`);
        seen.add(shared.installPath);
        p.stringList(shared.items, `${path}.items`);
        const hashes = p.stringList(shared.sha256, `${path}.sha256`);
        if (hashes.some((hash) => !SHA256.test(hash))) p.add(`${path}.sha256`, "malformed SHA-256");
      });
    }
  }
  if (!isObject(e.exports)) p.add("expectations.exports", "must be an object");
  else {
    p.keys(e.exports, ["values", "types", "bySourcePath"], "expectations.exports");
    p.stringList(e.exports.values, "expectations.exports.values");
    p.stringList(e.exports.types, "expectations.exports.types");
    if (!isObject(e.exports.bySourcePath)) p.add("expectations.exports.bySourcePath", "must be an object");
  }
  validateCssSurface(e.css, "expectations.css", p, ["scriptSuppliedCustomProperties", "sourceFiles", "resolvedAgainst"]);
  validateAuthorities(e.authorities, ["files", "dependencies", "exports", "css"], "expectations.authorities", p);
}

function validateNpmExpectations(e: Record<string, unknown>, p: Problems): void {
  p.keys(e, ["package", "dependencies", "exports", "css", "authorities"], "expectations");
  const pkg = e.package;
  if (!isObject(pkg)) p.add("expectations.package", "must be an object");
  else {
    if (!isNonEmptyString(pkg.name)) p.add("expectations.package.name", "must be a non-empty string");
    if (!isString(pkg.version) || !SEMVER.test(pkg.version)) p.add("expectations.package.version", "must be semver");
    if (!isObject(pkg.exportsMap) || Object.keys(pkg.exportsMap).length === 0) p.add("expectations.package.exportsMap", "must be a non-empty object");
    p.stringList(pkg.publicSpecifiers, "expectations.package.publicSpecifiers");
    if (!isObject(pkg.files)) p.add("expectations.package.files", "must be an object");
    else {
      p.stringList(pkg.files.required, "expectations.package.files.required");
      p.stringList(pkg.files.allowedExact, "expectations.package.files.allowedExact");
      p.stringList(pkg.files.allowedPrefixes, "expectations.package.files.allowedPrefixes");
    }
    if (!isObject(pkg.lifecycleScripts)) p.add("expectations.package.lifecycleScripts", "must be an object");
    else {
      p.keys(pkg.lifecycleScripts, ["allowedConsumerRun", "declaredConsumerRun", "declaredPublisherOnly"], "expectations.package.lifecycleScripts");
      p.stringList(pkg.lifecycleScripts.allowedConsumerRun, "expectations.package.lifecycleScripts.allowedConsumerRun");
      p.stringList(pkg.lifecycleScripts.declaredConsumerRun, "expectations.package.lifecycleScripts.declaredConsumerRun");
      p.stringList(pkg.lifecycleScripts.declaredPublisherOnly, "expectations.package.lifecycleScripts.declaredPublisherOnly");
    }
  }
  if (!isObject(e.dependencies)) p.add("expectations.dependencies", "must be an object");
  else {
    p.stringList(e.dependencies.npm, "expectations.dependencies.npm");
    p.stringList(e.dependencies.peers, "expectations.dependencies.peers");
    p.stringList(e.dependencies.optional, "expectations.dependencies.optional");
  }
  if (!isObject(e.exports)) p.add("expectations.exports", "must be an object");
  else {
    p.keys(e.exports, ["values", "types", "denied", "byModule"], "expectations.exports");
    const values = p.stringList(e.exports.values, "expectations.exports.values");
    const types = p.stringList(e.exports.types, "expectations.exports.types");
    const denied = p.stringList(e.exports.denied, "expectations.exports.denied");
    for (const name of values) if (types.includes(name)) p.add("expectations.exports", `"${name}" is both a value and a type export`);
    const publicSpecifiers = isObject(pkg) && Array.isArray(pkg.publicSpecifiers) ? (pkg.publicSpecifiers as string[]) : [];
    for (const specifier of denied) if (publicSpecifiers.includes(specifier)) p.add("expectations.exports.denied", `"${specifier}" is both public and denied`);
  }
  validateCssSurface(e.css, "expectations.css", p, ["scriptSuppliedCustomProperties", "sourceFiles"], ["stylesheetSpecifier"]);
  validateAuthorities(e.authorities, ["package", "dependencies", "exports", "css"], "expectations.authorities", p);
}

// ── result and evidence ─────────────────────────────────────────────────────

export function summarizeChecks(checks: readonly Pick<CcvCheck, "status">[]): CcvResult["summary"] {
  const summary = { pass: 0, fail: 0, unknown: 0, notApplicable: 0 };
  for (const check of checks) {
    if (check.status === "pass") summary.pass += 1;
    else if (check.status === "fail") summary.fail += 1;
    else if (check.status === "unknown") summary.unknown += 1;
    else summary.notApplicable += 1;
  }
  return summary;
}

function validateEvidence(value: unknown, path: string, p: Problems): void {
  if (!isObject(value)) return p.add(path, "must be an object");
  p.keys(value, ["kind", "ref", "observed", "sha256"], path);
  if (!(CCV_EVIDENCE_KINDS as readonly string[]).includes(value.kind as string)) p.add(`${path}.kind`, "unknown evidence kind");
  if (!isNonEmptyString(value.ref)) p.add(`${path}.ref`, "must be a non-empty reference");
  if (!isString(value.observed)) p.add(`${path}.observed`, "must be a string");
  else if (value.observed.length > CCV_EVIDENCE_OBSERVED_LIMIT) p.add(`${path}.observed`, `exceeds ${CCV_EVIDENCE_OBSERVED_LIMIT} characters (evidence is concise, never a log or file dump)`);
  if (value.sha256 !== undefined && (!isString(value.sha256) || !SHA256.test(value.sha256))) p.add(`${path}.sha256`, "malformed SHA-256");
}

export function validateCcvResult(input: unknown): CcvValidation {
  const p = new Problems();
  if (!isObject(input)) return { ok: false, problems: ["result: must be an object"] };
  p.keys(input, ["schemaVersion", "distribution", "mode", "subject", "environment", "source", "checks", "summary", "volatile"], "result");
  if (input.schemaVersion !== CCV_RESULT_SCHEMA_VERSION) p.add("schemaVersion", `unsupported (expected ${CCV_RESULT_SCHEMA_VERSION})`);
  const knownDistribution = (CCV_DISTRIBUTIONS as readonly string[]).includes(input.distribution as string);
  if (!knownDistribution) p.add("distribution", "unknown distribution");
  const knownMode = (CCV_MODES as readonly string[]).includes(input.mode as string);
  if (!knownMode) p.add("mode", "invalid mode");
  if (knownDistribution && knownMode && !CCV_MODES_BY_DISTRIBUTION[input.distribution as "shadcn-registry" | "npm-package"].includes(input.mode as never)) {
    p.add("mode", `${String(input.mode)} cannot verify ${String(input.distribution)}`);
  }
  if (!isNonEmptyString(input.subject)) p.add("subject", "must be a non-empty string");

  if (!isObject(input.environment)) p.add("environment", "must be an object");
  else {
    p.keys(input.environment, ["node", "platform", "packageManager", "tools"], "environment");
    for (const key of ["node", "platform", "packageManager"]) {
      if (input.environment[key] !== undefined && !isNonEmptyString(input.environment[key])) p.add(`environment.${key}`, "must be a non-empty string");
    }
    if (input.environment.tools !== undefined && (!isObject(input.environment.tools) || !Object.values(input.environment.tools).every(isNonEmptyString))) {
      p.add("environment.tools", "must map tool names to version strings");
    }
  }

  const source = input.source;
  if (!isObject(source)) p.add("source", "must be an object");
  else {
    p.keys(source, ["expectedGitSha", "observedGitSha", "packageVersion", "integrity"], "source");
    if (!isString(source.expectedGitSha) || !GIT_SHA.test(source.expectedGitSha)) p.add("source.expectedGitSha", "must be a 40-hex git SHA");
    if (source.observedGitSha !== undefined && (!isString(source.observedGitSha) || !GIT_SHA.test(source.observedGitSha))) p.add("source.observedGitSha", "must be a 40-hex git SHA");
    if (source.packageVersion !== undefined && (!isString(source.packageVersion) || !SEMVER.test(source.packageVersion))) p.add("source.packageVersion", "must be semver");
    if (source.integrity !== undefined && (!isString(source.integrity) || !INTEGRITY.test(source.integrity))) p.add("source.integrity", "must be an SRI integrity string");
  }

  const checks = input.checks;
  if (!Array.isArray(checks)) p.add("checks", "must be a list");
  else {
    const ids = new Set<string>();
    const distributionPrefix = input.distribution === "shadcn-registry" ? "shadcn:" : input.distribution === "npm-package" ? "npm:" : "";
    checks.forEach((check: unknown, index: number) => {
      const path = `checks[${index}]`;
      if (!isObject(check)) return p.add(path, "must be an object");
      p.keys(check, ["checkId", "status", "failureCode", "claim", "expected", "actual", "authority", "evidence"], path);
      if (!isString(check.checkId) || !CCV_ID_PATTERN.test(check.checkId)) p.add(`${path}.checkId`, "must be a stable id like shadcn:<item>:<category>:<key>");
      else {
        if (distributionPrefix && !check.checkId.startsWith(distributionPrefix)) p.add(`${path}.checkId`, `must start with "${distributionPrefix}" for this distribution`);
        if (ids.has(check.checkId)) p.add(`${path}.checkId`, `duplicate check id "${check.checkId}"`);
        ids.add(check.checkId);
      }
      const status = check.status;
      if (!(CHECK_STATUSES as readonly string[]).includes(status as string)) p.add(`${path}.status`, "must be pass, fail, unknown or not-applicable");
      if (!isNonEmptyString(check.claim)) p.add(`${path}.claim`, "must be a non-empty string");
      for (const key of ["expected", "actual"]) {
        if (check[key] !== undefined && !isString(check[key])) p.add(`${path}.${key}`, "must be a string");
      }
      if (!(CCV_AUTHORITIES as readonly string[]).includes(check.authority as string)) p.add(`${path}.authority`, "authority is required and must be a known source");
      if (check.failureCode !== undefined && !isCcvFailureCode(check.failureCode)) p.add(`${path}.failureCode`, "unknown failure code");
      if (status === "fail" && check.failureCode === undefined) p.add(`${path}.failureCode`, "a fail requires a failure code");
      if ((status === "pass" || status === "not-applicable") && check.failureCode !== undefined) p.add(`${path}.failureCode`, `a ${String(status)} cannot carry a failure code`);
      if (status === "fail" && check.failureCode === "ENVIRONMENT_ERROR") p.add(`${path}.failureCode`, "an environment error is not a contract failure; record the check as unknown");
      if (status === "unknown" && check.failureCode !== undefined && check.failureCode !== "ENVIRONMENT_ERROR") p.add(`${path}.failureCode`, "an unknown may only carry ENVIRONMENT_ERROR");
      if (!Array.isArray(check.evidence)) p.add(`${path}.evidence`, "must be a list");
      else {
        check.evidence.forEach((entry: unknown, evidenceIndex: number) => validateEvidence(entry, `${path}.evidence[${evidenceIndex}]`, p));
        if (status === "fail" && check.evidence.length === 0) p.add(`${path}.evidence`, "a fail must carry evidence so it can be diagnosed");
      }
    });
    const summary = input.summary;
    if (!isObject(summary)) p.add("summary", "must be an object");
    else {
      p.keys(summary, ["pass", "fail", "unknown", "notApplicable"], "summary");
      const counted = summarizeChecks(checks.filter(isObject) as unknown as Pick<CcvCheck, "status">[]);
      for (const key of ["pass", "fail", "unknown", "notApplicable"] as const) {
        if (summary[key] !== counted[key]) p.add(`summary.${key}`, `is ${String(summary[key])} but the checks contain ${counted[key]}`);
      }
    }
  }
  if (input.volatile !== undefined) {
    if (!isObject(input.volatile)) p.add("volatile", "must be an object");
    else p.keys(input.volatile, ["startedAt", "durationMs"], "volatile");
  }
  return p.result();
}
