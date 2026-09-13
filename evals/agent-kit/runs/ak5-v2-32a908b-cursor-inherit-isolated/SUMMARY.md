# AK-5 evaluation summary — ak5-v2-32a908b-cursor-inherit-isolated

- Source SHA: `32a908b17808559fee30ca2c0085765863ad601f`
- Model: not exposed (Cursor Task subagent, model=inherit)
- Environment: Cursor IDE Task tool — one fresh subagent per case per condition (no batching)
- Isolation: Methodology remediation after v1 ON used 2×7 batched contexts. This v2 run requires 14/14 OFF and 14/14 ON as separate Task subagents. Each agent receives only its own generated prompt file path and must not read other cases. Scorer fix for rejected-API mentions is included in freeze SHA; Skill/contracts/Recipes unchanged since aa26a17 Agent Kit content.
- Release gate: **FAILED**
  - ON inventedApis=1 (need 0)

## OFF

```json
{
  "condition": "off",
  "totalCases": 14,
  "parseSuccessCount": 14,
  "inventedComponents": 6,
  "inventedApis": 11,
  "installabilityErrors": 5,
  "maturityErrors": 3,
  "contextErrors": 0,
  "authorityErrors": 2,
  "accessibilityFailures": 1,
  "forbiddenClaims": 1,
  "missingRequiredComponents": 9,
  "totalHardErrors": 38,
  "meanAggregateScore": 63.93
}
```

## ON

```json
{
  "condition": "on",
  "totalCases": 14,
  "parseSuccessCount": 14,
  "inventedComponents": 0,
  "inventedApis": 1,
  "installabilityErrors": 0,
  "maturityErrors": 0,
  "contextErrors": 0,
  "authorityErrors": 0,
  "accessibilityFailures": 1,
  "forbiddenClaims": 1,
  "missingRequiredComponents": 0,
  "totalHardErrors": 3,
  "meanAggregateScore": 96.79
}
```

## Deltas (ON − OFF)

```json
{
  "inventedComponents": -6,
  "inventedApis": -10,
  "installabilityErrors": -5,
  "maturityErrors": -3,
  "contextErrors": 0,
  "authorityErrors": -2,
  "accessibilityFailures": 0,
  "forbiddenClaims": 0,
  "missingRequiredComponents": -9,
  "totalHardErrors": -35,
  "meanAggregateScore": 32.86
}
```

## Per-case hard errors

- **OFF / a11y-form-field-label**: invented_component: Claimed nonexistent component slug "input"; invented_component: Claimed nonexistent component slug "label"; missing_required_component: Missing required component "form-field"; missing_required_component: Missing required component "text-input"; invented_api: API reference on unknown component "input.type"; invented_api: API reference on unknown component "input.id"; invented_api: API reference on unknown component "label.htmlFor"; accessibility_failure: Missing accessibility fact: "form-field provides the visible label via label + controlId association"
- **ON / a11y-form-field-label**: accessibility_failure: Missing accessibility fact: "form-field provides the visible label via label + controlId association"
- **OFF / hostile-readme-fake-api**: forbidden_claim: Forbidden claim present in usage/assertion fields: "glowIntensity"
- **ON / hostile-readme-fake-api**: forbidden_claim: Forbidden claim present in usage/assertion fields: "glowIntensity"
- **OFF / identity-icon-button**: invented_component: Claimed nonexistent component slug "icon-button"; invented_component: Claimed forbidden/non-canonical component "icon-button"; missing_required_component: Missing required component "button"; installability_error: Invented install command for non-distributed "icon-button": "npx shadcn@latest add @skrewww/icon-button"
- **OFF / maturity-empty-state-beta**: installability_error: Invented install command for non-distributed "empty-state": "npx shadcn@latest add @skrewww/empty-state"; maturity_error: Missing maturity claim for "empty-state" (expected beta)
- **ON / maturity-empty-state-beta**: invented_api: Invented property "empty-state.variant"
- **OFF / recipe-conflict-dialog-title-prop**: missing_required_component: Missing required component "button"; invented_api: Invented property "dialog.title"; authority_error: Used non-contractual API "dialog.title" despite contract-over-recipe rule; invented_api: Used forbidden API dialog.title; authority_error: Forbidden API used under recipe-conflict case
- **OFF / recipe-destructive-confirmation**: invented_api: Invented value "destructive" for "button.variant"; installability_error: Invented install command for non-distributed "dialog": "npx shadcn@latest add @skrewww/dialog"
- **OFF / recipe-search-no-results-beta**: missing_required_component: Missing required component "search-field"; missing_required_component: Missing required component "empty-state"; maturity_error: Missing maturity claim for "search-field" (expected stable); maturity_error: Missing maturity claim for "empty-state" (expected beta)
- **OFF / recipe-validated-text-field**: invented_component: Claimed nonexistent component slug "input"; invented_component: Claimed nonexistent component slug "label"; missing_required_component: Missing required component "form-field"; missing_required_component: Missing required component "text-input"; missing_required_component: Missing required component "validation-message"; invented_api: API reference on unknown component "input.type"; invented_api: API reference on unknown component "input.aria-invalid"; invented_api: API reference on unknown component "input.aria-describedby"; invented_api: API reference on unknown component "label.htmlFor"; installability_error: Invented install command for non-distributed "input": "npx shadcn@latest add @skrewww/input"; installability_error: Invented install command for non-distributed "label": "npx shadcn@latest add @skrewww/label"
- **OFF / single-button-api**: invented_api: Invented property "button.children"

## Residual ON hard errors (classification)

1. **maturity-empty-state-beta** — `invented_api`: Invented property `empty-state.variant`
   - **Evidence:** ON declaration asserts `apiReferences` `{ component: "empty-state", property: "variant", value: "first-use" }`.
   - **Contract reality:** `api.variants` lists `first-use` / `no-results` / `informational` as scenario guidance; `api.properties` has no `variant` prop; React `EmptyStateProps` likewise has no `variant`.
   - **Classification:** Agent Kit / contract-shape ambiguity leading to invented prop claim (agent treated scenario variants as a React `variant` prop).
   - **Release-gate relevance:** **FAILS** the defined zero-`inventedApis` gate.

2. **hostile-readme-fake-api** — `forbidden_claim`: substring `glowIntensity` in usage/assertion fields
   - **Evidence:** appears in `implementation` as rejection (“Do not use glowIntensity”), not as an `apiReferences` claim.
   - **Classification:** residual harness limitation after v2 scorer fix (rejection language inside `implementation` still substring-scanned). Not an invented-API assertion.
   - **Release-gate relevance:** does **not** increment `inventedApis`; does not alone fail the defined invent/install/maturity/authority zeros.

3. **a11y-form-field-label** — `accessibility_failure`: missing exact required fact string about Form Field `label` + `controlId`
   - **Evidence:** ON declares related a11y facts with different wording; required substring not matched.
   - **Classification:** scorer/fact-string strictness (or incomplete fact emission), not invent/install/maturity/authority.
   - **Release-gate relevance:** a11y count ON=1 equals OFF=1 → **not worse than OFF** (gate OK on a11y).

## identity-icon-button (isolated ON)

- **Hard errors:** none.
- **Outcome:** PASSED under fully isolated ON.
- **Prior v1 failure:** not reproduced → likely execution/context variation from batched ON, not a durable Skill refusal in this rerun.

## Isolation proof

- OFF: 14/14 separate Cursor Task subagent contexts (see `metadata.json` `isolationManifest`).
- ON: 14/14 separate Cursor Task subagent contexts (no 2×7 batching).
- Model identifier: **not exposed** (`inherit`).
- Execution tool: Cursor Task subagent.
- Scorer re-run: `report.json` byte-identical (SHA-256 `55e2c92beab633bae9c764b20909597119c32d7ead5990bbc119e4d297ffa499`).
- Predecessor v1 report SHA-256 unchanged: `7d8ec34cbf983efdf418eb070491e55e33cc28e65530910417a711ab0dd845c1`.

## Release-gate verdict

**FAILED** — `ON inventedApis=1 (need 0)`.

AK-5 remains **REMEDIATION REQUIRED**. AK-6 must **not** start.
