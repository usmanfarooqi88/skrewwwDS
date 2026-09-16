/**
 * `api/nonexistent-prop` — docs/architecture/guard-readiness-audit.md
 * §3.2 — **BLOCKED for G-1.** This file exists to record the exact
 * evidence for that decision visibly in the codebase, not to silently
 * omit the rule.
 *
 * ---
 *
 * ## The blocker, with real evidence (not speculation)
 *
 * The G-1 brief required verifying, BEFORE implementing this rule,
 * whether the canonical registry's `apiProps` field can safely serve as
 * a complete "valid prop" allow-list — i.e., whether a JSX attribute name
 * absent from `api.properties` can be safely treated as invented.
 *
 * It cannot. Confirmed directly against real component source and real
 * registry data, not assumed:
 *
 * 1. `components/ui/Button.tsx`'s real TypeScript type is
 *    `ButtonProps = SharedButtonProps & Omit<ButtonHTMLAttributes<
 *    HTMLButtonElement>, keyof SharedButtonProps> & {...}` — Button
 *    structurally, genuinely accepts the *entire* native `<button>`
 *    attribute set (className, id, style, onClick and every other DOM
 *    event handler, tabIndex, type, form, etc.), not just its own
 *    documented custom props.
 * 2. Button's real `apiProps` array (`lib/component-registry.ts`) lists
 *    exactly ten props: variant, size, loading, fullWidth, leadingIcon,
 *    trailingIcon, href, target, disabled, aria-label. `disabled` and
 *    `aria-label` — two native/global attributes — happen to be
 *    individually documented because they're especially relevant to
 *    Button's own guidance. **className, onClick, id, style, tabIndex,
 *    type, children, and every other aria- or data- attribute variant
 *    are absent**, despite being real, valid, structurally-supported
 *    props.
 * 3. This is not Button-specific: `components/ui/Card.tsx` itself uses
 *    `className` in its own implementation (destructured and applied to
 *    the rendered element), but Card's real `apiProps`
 *    (as, elevation, title, children, headingLevel, footer) does not
 *    list it either. 43 of 116 files under `components/ui/` declare
 *    `className?: string` directly in their own prop types — a common,
 *    real, structurally-supported pattern the registry's `apiProps`
 *    field was never designed to exhaustively enumerate.
 *
 * There is no other canonical Skrewww-specific source that distinguishes
 * "legitimate native/inherited prop this component happens to forward"
 * from "invented custom prop" on a per-component basis.
 *
 * ## Why the two available workarounds are both explicitly forbidden
 *
 * - **A hand-built allow-list of every standard HTML/React DOM
 *   attribute** (className, id, style, onClick and every other event
 *   handler, tabIndex, type, value, checked, placeholder, href, ...)
 *   would let the rule distinguish `onClick` (real) from `glowIntensity`
 *   (invented) — but this is exactly the "giant manual HTML-prop
 *   allow-list" the G-1 brief explicitly forbids building without the
 *   readiness audit's authorization, which §3.2 does not grant.
 * - **Full TypeScript type-checking** (resolving each component's real
 *   prop type via `ts.Program` + `ts.TypeChecker`, with real module
 *   resolution) would answer this correctly and precisely, but is
 *   meaningfully heavier infrastructure than G-0 built (G-0's parser is
 *   explicitly single-file, `noResolve: true`, no project-wide module
 *   resolution — see `docs/architecture/guard-foundation.md` §3) and was
 *   never proposed as in-scope for the locked v0.1 rule set.
 *
 * A narrower middle ground was considered and rejected: excluding only a
 * small, spec-derived set (`aria-*`/`data-*` wildcards, `key`/`ref`/
 * `children`, a short HTML Global Attributes list) and treating
 * everything else absent from `api.properties` as a violation. This
 * still fails the G-1 brief's own absolute requirement ("must not create
 * false positives for legal native/inherited props") — `className`
 * alone is proven, real, current, and would still be flagged, since it
 * is not itself a Global Attribute name recognized by that small set in
 * every relevant sense, and the same is true for `onClick` and other
 * per-element native attributes this repo's components genuinely accept
 * but never individually list.
 *
 * ## Disposition
 *
 * Per the G-1 brief's own explicit instruction ("If the canonical audit
 * does NOT provide a safe deterministic way to distinguish invalid
 * custom props from inherited native React props: STOP this rule and
 * report the blocker"): **BLOCKED, not implemented in G-1.** This makes
 * the overall G-1 verdict PARTIAL (6 of 7 locked rules implemented; this
 * one explicitly, evidentially blocked) rather than either a false
 * "complete" claim or an unsafe implementation that reintroduces exactly
 * the false-positive risk this entire Guard readiness chain exists to
 * prevent.
 *
 * Recorded for a future phase (not decided or scoped here): resolving
 * this blocker would need either (a) the readiness audit's own approval
 * to build a bounded native-attribute allow-list, explicitly scoped and
 * risk-assessed, or (b) real type-checking infrastructure, added as a
 * deliberate, evidenced architecture decision — not invented in G-1.
 */
export const API_NONEXISTENT_PROP_BLOCKED = true;
