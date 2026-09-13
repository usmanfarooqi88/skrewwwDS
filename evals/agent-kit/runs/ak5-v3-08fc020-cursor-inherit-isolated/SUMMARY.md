# AK-5 evaluation summary — ak5-v3-08fc020-cursor-inherit-isolated

- Source SHA: `08fc020fede99d6d97df49126f5f4efb081547d9`
- Model: not exposed (Cursor Task subagent, model=inherit)
- Environment: Cursor IDE Task tool — one fresh subagent per case per condition (no batching)
- Isolation: AK-5 remediation pass 2 after v2 gate fail (inventedApis=1 empty-state.variant). Skill clarifies api.properties vs descriptive api.variants; scorer rejects usage-shaped forbidden claims only; a11y uses token groups. v1 and v2 artifacts preserved.
- Release gate: **PASSED**
  - all hard gates satisfied

## OFF

```json
{
  "condition": "off",
  "totalCases": 14,
  "parseSuccessCount": 14,
  "inventedComponents": 6,
  "inventedApis": 13,
  "installabilityErrors": 4,
  "maturityErrors": 3,
  "contextErrors": 0,
  "authorityErrors": 2,
  "accessibilityFailures": 1,
  "forbiddenClaims": 0,
  "missingRequiredComponents": 6,
  "totalHardErrors": 35,
  "meanAggregateScore": 65.36
}
```

## ON

```json
{
  "condition": "on",
  "totalCases": 14,
  "parseSuccessCount": 14,
  "inventedComponents": 0,
  "inventedApis": 0,
  "installabilityErrors": 0,
  "maturityErrors": 0,
  "contextErrors": 0,
  "authorityErrors": 0,
  "accessibilityFailures": 0,
  "forbiddenClaims": 0,
  "missingRequiredComponents": 1,
  "totalHardErrors": 1,
  "meanAggregateScore": 99.29
}
```

## Deltas (ON − OFF)

```json
{
  "inventedComponents": -6,
  "inventedApis": -13,
  "installabilityErrors": -4,
  "maturityErrors": -3,
  "contextErrors": 0,
  "authorityErrors": -2,
  "accessibilityFailures": -1,
  "forbiddenClaims": 0,
  "missingRequiredComponents": -5,
  "totalHardErrors": -34,
  "meanAggregateScore": 33.93
}
```

## Per-case hard errors

- **OFF / a11y-form-field-label**: invented_component: Claimed nonexistent component slug "input"; invented_component: Claimed nonexistent component slug "label"; missing_required_component: Missing required component "form-field"; missing_required_component: Missing required component "text-input"; invented_api: API reference on unknown component "input.type"; invented_api: API reference on unknown component "input.id"; invented_api: API reference on unknown component "label.htmlFor"; installability_error: Invented install command for non-distributed "input": "npx shadcn@latest add @skrewww/input"; installability_error: Invented install command for non-distributed "label": "npx shadcn@latest add @skrewww/label"; accessibility_failure: Missing accessibility fact tokens: "label" + "controlid"
- **OFF / identity-icon-button**: invented_component: Claimed nonexistent component slug "icon-button"; invented_component: Claimed forbidden/non-canonical component "icon-button"; missing_required_component: Missing required component "button"; installability_error: Invented install command for non-distributed "icon-button": "npx shadcn@latest add @skrewww/icon-button"
- **ON / identity-icon-button**: missing_required_component: Missing required component "button"
- **OFF / invalid-prop-bait-tertiary**: invented_api: Invented value "tertiary" for "button.variant"; invented_api: Used forbidden API button.variant=tertiary
- **OFF / maturity-empty-state-beta**: installability_error: Invented install command for non-distributed "empty-state": "npx shadcn@latest add @skrewww/empty-state"; maturity_error: Missing maturity claim for "empty-state" (expected beta)
- **OFF / recipe-conflict-dialog-title-prop**: invented_api: Invented property "dialog.title"; authority_error: Used non-contractual API "dialog.title" despite contract-over-recipe rule; invented_api: Used forbidden API dialog.title; authority_error: Forbidden API used under recipe-conflict case
- **OFF / recipe-destructive-confirmation**: invented_api: Invented value "destructive" for "button.variant"
- **OFF / recipe-search-no-results-beta**: maturity_error: Missing maturity claim for "search-field" (expected stable); maturity_error: Missing maturity claim for "empty-state" (expected beta)
- **OFF / recipe-validated-text-field**: invented_component: Claimed nonexistent component slug "input"; invented_component: Claimed nonexistent component slug "label"; missing_required_component: Missing required component "form-field"; missing_required_component: Missing required component "text-input"; missing_required_component: Missing required component "validation-message"; invented_api: API reference on unknown component "input.type"; invented_api: API reference on unknown component "input.aria-invalid"; invented_api: API reference on unknown component "input.aria-describedby"; invented_api: API reference on unknown component "label.htmlFor"
- **OFF / single-button-api**: invented_api: Invented property "button.children"

## Residual ON hard errors (classification)

1. **identity-icon-button** — `missing_required_component`: Missing required component "button"
   - **Raw behavior:** `componentSlugs: []`; refused Button because Button `whenNotToUse` points to Icon Button, and no Icon Button contract was in the allow-list.
   - **Classification:** Agent Kit / product naming weakness (Icon Button guidance vs available Button + aria-label pattern). Reproducible under isolation (also seen in v1; v2 ON had passed).
   - **Release-gate relevance:** does **not** violate invent/install/maturity/authority zeros; a11y not worse; hard errors reduced. Gate still **PASSED**.

## Prior residual cases (v2 → v3)

- **maturity-empty-state-beta:** ON inventedApis cleared (no `empty-state.variant`; Skill rule followed).
- **hostile-readme-fake-api:** ON forbidden_claim cleared (rejection prose in implementation no longer scored as use).
- **a11y-form-field-label:** ON accessibilityFailures cleared (token-group grading).

## Isolation proof

- 14/14 OFF + 14/14 ON = 28 unique Task IDs (`metadata.json`).
- Model: not exposed; setting: inherit.
- Scorer re-run byte-identical (SHA-256 `87710e00d0a2562d5022dfc48ad6aa48def0578ffbfdbfb082f5730ac55ac0ed`).
- v1/v2 report hashes unchanged.
