import type { CcvFailureCode } from "@/lib/ccv/failure-codes";

/**
 * CCV-4 — pure judgements over evidence collected in a real browser. The browser
 * layer only gathers facts; every pass/fail decision is here, so it is testable
 * without Chromium. Runtime style failures are `CSS_RUNTIME_UNRESOLVED`;
 * behavioural scenario failures are `INTERACTION_FAILED`; a browser or server
 * that cannot start is an environment error decided by the caller.
 */

export type Judgement = { status: "pass" | "fail" | "unknown"; failureCode?: CcvFailureCode; detail: string };

export type FoundationEvidence = { checked: number; empty: string[] };
export function judgeFoundationActive(evidence: FoundationEvidence): Judgement {
  if (evidence.checked === 0) return { status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED", detail: "no :root-declared Foundation custom property was found to check" };
  if (evidence.empty.length > 0) return { status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED", detail: `${evidence.empty.length} of ${evidence.checked} :root custom properties are empty on the page: ${evidence.empty.slice(0, 8).join(", ")}` };
  return { status: "pass", detail: `all ${evidence.checked} :root-declared Foundation custom properties have a computed value on <html>` };
}

export type FocusEvidence = { reached: boolean; tabPresses: number; matchesFocusVisible: boolean; outlineStyle: string; outlineWidth: string; outlineColor: string; boxShadow: string };
export function judgeFocusVisible(evidence: FocusEvidence): Judgement {
  const outline = evidence.outlineStyle !== "none" && parseFloat(evidence.outlineWidth) > 0 && !/rgba\(0, 0, 0, 0\)|transparent/.test(evidence.outlineColor);
  const shadow = evidence.boxShadow !== "none" && evidence.boxShadow !== "";
  const detail = `keyboard Tab ×${evidence.tabPresses}; :focus-visible ${evidence.matchesFocusVisible ? "matches" : "does not match"}; outline ${evidence.outlineStyle} ${evidence.outlineWidth} ${evidence.outlineColor}; box-shadow ${evidence.boxShadow.slice(0, 60)}`;
  if (!evidence.reached) return { status: "fail", failureCode: "INTERACTION_FAILED", detail: `the representative control was not reached by keyboard (${detail})` };
  if (!evidence.matchesFocusVisible || !(outline || shadow)) return { status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED", detail };
  return { status: "pass", detail };
}

export type SuppliedEvidence = { prop: string; scenario?: string; elementsWithValue: number; sample?: string };
export function judgeRuntimeSupplied(evidence: SuppliedEvidence): Judgement {
  if (!evidence.scenario) return { status: "unknown", detail: `${evidence.prop}: assigned by installed source, but no scenario renders the component, so runtime supply is not proven` };
  if (evidence.elementsWithValue === 0) return { status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED", detail: `${evidence.prop}: no rendered element has a value in scenario ${evidence.scenario}` };
  return { status: "pass", detail: `${evidence.prop}: supplied at runtime on ${evidence.elementsWithValue} element(s) in scenario ${evidence.scenario} (e.g. ${evidence.sample ?? "?"})` };
}

/** Browser console noise that is not a component error (the existing smoke filters favicon only). */
export const isConsoleNoise = (message: string) => /favicon/i.test(message);

const STYLE_MESSAGE = /resolv|token|var\(--|colou?r|radius|background|border|shadow|computed|padding|clip-path|backdrop|opacity|surface/i;

export type ScenarioEvidence = { name: string; kind: "render" | "runtime"; httpStatus: number | null; renderedElements: number; assertionError?: string; consoleErrors: string[] };
export function judgeScenario(evidence: ScenarioEvidence): Judgement {
  const errors = evidence.consoleErrors.filter((message) => !isConsoleNoise(message));
  if (evidence.httpStatus === null || evidence.httpStatus >= 400) return { status: "fail", failureCode: "INTERACTION_FAILED", detail: `route responded ${evidence.httpStatus ?? "no response"}` };
  if (evidence.assertionError) return { status: "fail", failureCode: STYLE_MESSAGE.test(evidence.assertionError) ? "CSS_RUNTIME_UNRESOLVED" : "INTERACTION_FAILED", detail: evidence.assertionError };
  if (evidence.renderedElements === 0) return { status: "fail", failureCode: "INTERACTION_FAILED", detail: "the scenario page rendered no element" };
  if (errors.length > 0) return { status: "fail", failureCode: "INTERACTION_FAILED", detail: `console/page errors: ${errors.slice(0, 3).join(" | ")}` };
  return { status: "pass", detail: evidence.kind === "runtime" ? "the existing browserAssert scenario passed against the installed consumer" : `rendered ${evidence.renderedElements} element(s) without console or page errors` };
}

export type RecordedAssertion = { name: string; ok: boolean; detail?: string };

/** Stable check key for a recorded assertion name ("Shape pill: computed behavior" → "shape-pill"). */
export function assertionKey(name: string): string {
  const mode = /^(Shape|Surface) ([a-z]+): computed behavior$/.exec(name);
  if (mode) return `${mode[1].toLowerCase()}-${mode[2]}`;
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

const STYLE_ASSERTION = /^(Shape|Surface) |tokens resolve|token styling|layout\/styling|animates|reaches portaled/i;
export function judgeRecorded(assertion: RecordedAssertion): Judgement {
  if (assertion.ok) return { status: "pass", detail: assertion.detail ? `${assertion.name} — ${assertion.detail}` : assertion.name };
  return { status: "fail", failureCode: STYLE_ASSERTION.test(assertion.name) ? "CSS_RUNTIME_UNRESOLVED" : "INTERACTION_FAILED", detail: `${assertion.name} — ${assertion.detail ?? "failed"}` };
}
