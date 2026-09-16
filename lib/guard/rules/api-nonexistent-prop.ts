/**
 * `api/nonexistent-prop` — **FORMALLY DEFERRED from Guard v0.1**
 * (G-1A governance refinement of the readiness audit's original 7-rule set).
 *
 * This file records implementation evidence. It does **not** register a rule
 * and contains no evaluation logic. See `GUARD_RULE_CATALOG` — six approved
 * v0.1 rules only.
 *
 * ---------------------------------------------------------------------------
 * Intended semantics (readiness audit §3.2 vs G-1A clarification)
 * ---------------------------------------------------------------------------
 *
 * The readiness audit named the rule as: literal JSX attribute absent from
 * contract `api.properties` on a provenance-gated Skrewww component.
 *
 * That is semantic model **A — canonical Skrewww documented API**, not
 * model **B — accepted by the consumer's current local TypeScript props
 * type**. Those are not the same under shadcn local-copy distribution
 * (consumers may edit installed source). G-1A keeps that distinction
 * explicit and does not blur them.
 *
 * ---------------------------------------------------------------------------
 * Why `api.properties` alone cannot back an ERROR rule (G-1 evidence)
 * ---------------------------------------------------------------------------
 *
 * Confirmed against real source (not speculation):
 *
 * 1. `ButtonProps = SharedButtonProps &
 *    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedButtonProps>
 *    & …` — Button accepts the full native button attribute set.
 * 2. Button's registry `apiProps` lists a documented subset only. Legal
 *    props such as `className`, `onClick`, `id`, `style`, `tabIndex`,
 *    `type`, and most `aria-*` / `data-*` names are absent from
 *    `api.properties` despite being structurally valid.
 * 3. Systemic: many components declare / forward `className` without
 *    listing it in `apiProps` (G-1 measured 43/116 `components/ui` files
 *    with a direct `className?: string`).
 *
 * PH-0 already warned: `api.properties` is an allow-list of known-good
 * *documented* names — **not** proof a name is invalid
 * (`docs/architecture/pre-guard-hardening.md` §3).
 *
 * ---------------------------------------------------------------------------
 * Why a TypeScript Program / Checker approach fails the G-1A gate (G-1A)
 * ---------------------------------------------------------------------------
 *
 * Prototype (project `ts.Program` + `getTypeChecker()`, public APIs only,
 * against real `Button` / `TextInput` / `Textarea` / `Table` / `Dialog`
 * / `DrawerTrigger` source — temporary probe, not shipped):
 *
 * 1. **Native overlap with `tsc`:** TypeScript already emits precise
 *    `TS2322` excess-property diagnostics for
 *    `<Button definitelyNotARealProp="x" />` when the component resolves.
 *    A Guard rule that re-asks the checker for the same fact is a weaker
 *    or equal duplicate of `npm run typecheck`, not independent Skrewww
 *    governance value for v0.1.
 * 2. **`data-*` false-positive vs G-1A VALID examples:** resolving
 *    Button's call-signature props type via
 *    `checker.getPropertyOfType(propsType, "data-testid")` returns
 *    **missing**, and `tsc` itself rejects
 *    `<Button data-testid="save" />` as not assignable to
 *    `ButtonComponentProps` (intersection typing drops React's loose
 *    `data-*` acceptance). The G-1A false-positive gate requires
 *    `data-*` accepted — a type-mirror rule fails that gate against
 *    *real* Button types in this repo.
 * 3. **Project Program required:** correct answers need module
 *    resolution + React types + component source. That is not the G-0
 *    single-file `noResolve` model. Scoping "project mode only" still
 *    leaves (1) and (2).
 * 4. **Local type ≠ canonical API:** under shadcn local copies, the
 *    checker validates the consumer's possibly-edited ButtonProps. That
 *    answers model B, not the readiness audit's model A. Implementing
 *    model B under the locked name `api/nonexistent-prop` would silently
 *    change the rule's meaning.
 * 5. **Manual DOM allow-list:** still rejected (G-1A Part 14 / G-1 brief).
 *
 * ---------------------------------------------------------------------------
 * Disposition
 * ---------------------------------------------------------------------------
 *
 * **DEFERRED from Guard v0.1** by implementation evidence (G-1A Outcome B).
 *
 * Revised locked v0.1 implementation set: **6 approved rules**.
 * Original readiness-audit plan listed 7; G-1 shipped 6 with this rule
 * BLOCKED; G-1A converts that block into an explicit post-v0.1 deferral.
 *
 * Future revisit requires one of:
 * - a new canonical metadata surface that safely encodes
 *   documented custom props **plus** inherited/native acceptance without
 *   duplicating React DOM types by hand, with false-positive proof; or
 * - a deliberate architecture decision to consume project-wide
 *   TypeScript diagnostics as Skrewww-branded findings (model B), with
 *   explicit acceptance that this duplicates `tsc` and tracks local
 *   types — not approved for v0.1.
 *
 * Until then: no evaluation function, no catalog entry, no partial
 * approximation.
 */
export const API_NONEXISTENT_PROP_DEFERRED = true;

/** @deprecated Use `API_NONEXISTENT_PROP_DEFERRED` — G-1 name retained for grep continuity. */
export const API_NONEXISTENT_PROP_BLOCKED = API_NONEXISTENT_PROP_DEFERRED;
