import { readFileSync } from "node:fs";
import type { InstallabilityClaim, MaturityClaim } from "@/lib/guard/structured-claims";

/**
 * Narrow JSON data schema for structured claims — DATA input, not Guard
 * config (docs/architecture/guard-readiness-audit.md §20 / G-2 Part 16).
 *
 * {
 *   "maturity": [{ "componentSlug": string, "claimedStatus": string, "location"?: string }],
 *   "installability": [{ "componentSlug": string, "claimedInstallable": boolean, "location"?: string }]
 * }
 */
export type StructuredClaimsFile = {
  maturity?: MaturityClaim[];
  installability?: InstallabilityClaim[];
};

export type LoadStructuredClaimsResult =
  | { ok: true; claims: StructuredClaimsFile }
  | { ok: false; message: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMaturityClaim(value: unknown, index: number): MaturityClaim | string {
  if (!isPlainObject(value)) return `maturity[${index}] must be an object`;
  if (typeof value.componentSlug !== "string" || value.componentSlug.length === 0) {
    return `maturity[${index}].componentSlug must be a non-empty string`;
  }
  if (typeof value.claimedStatus !== "string") {
    return `maturity[${index}].claimedStatus must be a string`;
  }
  if (value.location !== undefined && typeof value.location !== "string") {
    return `maturity[${index}].location must be a string when present`;
  }
  const claim: MaturityClaim = {
    componentSlug: value.componentSlug,
    claimedStatus: value.claimedStatus,
  };
  if (typeof value.location === "string") claim.location = value.location;
  return claim;
}

function parseInstallabilityClaim(value: unknown, index: number): InstallabilityClaim | string {
  if (!isPlainObject(value)) return `installability[${index}] must be an object`;
  if (typeof value.componentSlug !== "string" || value.componentSlug.length === 0) {
    return `installability[${index}].componentSlug must be a non-empty string`;
  }
  if (typeof value.claimedInstallable !== "boolean") {
    return `installability[${index}].claimedInstallable must be a boolean`;
  }
  if (value.location !== undefined && typeof value.location !== "string") {
    return `installability[${index}].location must be a string when present`;
  }
  const claim: InstallabilityClaim = {
    componentSlug: value.componentSlug,
    claimedInstallable: value.claimedInstallable,
  };
  if (typeof value.location === "string") claim.location = value.location;
  return claim;
}

/** Parse and validate a structured-claims JSON object (already parsed). */
export function parseStructuredClaimsJson(raw: unknown): LoadStructuredClaimsResult {
  if (!isPlainObject(raw)) {
    return { ok: false, message: "Structured claims JSON must be an object" };
  }

  const claims: StructuredClaimsFile = {};

  if (raw.maturity !== undefined) {
    if (!Array.isArray(raw.maturity)) {
      return { ok: false, message: "maturity must be an array when present" };
    }
    const maturity: MaturityClaim[] = [];
    for (let i = 0; i < raw.maturity.length; i++) {
      const parsed = parseMaturityClaim(raw.maturity[i], i);
      if (typeof parsed === "string") return { ok: false, message: parsed };
      maturity.push(parsed);
    }
    claims.maturity = maturity;
  }

  if (raw.installability !== undefined) {
    if (!Array.isArray(raw.installability)) {
      return { ok: false, message: "installability must be an array when present" };
    }
    const installability: InstallabilityClaim[] = [];
    for (let i = 0; i < raw.installability.length; i++) {
      const parsed = parseInstallabilityClaim(raw.installability[i], i);
      if (typeof parsed === "string") return { ok: false, message: parsed };
      installability.push(parsed);
    }
    claims.installability = installability;
  }

  // Reject unknown top-level keys so this cannot become a config file.
  for (const key of Object.keys(raw)) {
    if (key !== "maturity" && key !== "installability") {
      return {
        ok: false,
        message: `Unknown structured-claims field "${key}" — only maturity and installability are allowed`,
      };
    }
  }

  return { ok: true, claims };
}

export function loadStructuredClaimsFromFile(filePath: string): LoadStructuredClaimsResult {
  let text: string;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    return { ok: false, message: `Could not read structured claims file: ${filePath}` };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, message: `Structured claims file is not valid JSON: ${filePath}` };
  }

  return parseStructuredClaimsJson(parsed);
}
