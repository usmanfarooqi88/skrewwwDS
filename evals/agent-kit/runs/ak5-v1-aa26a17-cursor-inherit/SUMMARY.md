# AK-5 evaluation summary — ak5-v1-aa26a17-cursor-inherit

- Source SHA: `aa26a17b130480a6f516e945560f557e59d39a5f`
- Model: not exposed (Cursor Task subagent, model=inherit)
- Environment: Cursor IDE Task tool — isolated subagent prompts, no shared chat memory between cases
- Isolation: OFF: 14 separate Cursor Task subagents, one prompt each (no Agent Kit corpus). ON: two Task subagents each processing 7 self-contained generated on.md prompts (progressive Skill+relevant contracts/Recipes); weaker within-condition isolation than OFF because cases shared a batch conversation — documented limitation. Subagents instructed not to read beyond the provided/on.md prompts. Model id not exposed by tooling (inherit).
- Release gate: **PASSED**
  - all hard gates satisfied

## OFF

```json
{
  "condition": "off",
  "totalCases": 14,
  "parseSuccessCount": 14,
  "inventedComponents": 9,
  "inventedApis": 40,
  "installabilityErrors": 3,
  "maturityErrors": 5,
  "contextErrors": 0,
  "authorityErrors": 0,
  "accessibilityFailures": 1,
  "forbiddenClaims": 2,
  "missingRequiredComponents": 7,
  "totalHardErrors": 67,
  "meanAggregateScore": 38.93
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
  "forbiddenClaims": 1,
  "missingRequiredComponents": 1,
  "totalHardErrors": 2,
  "meanAggregateScore": 98.21
}
```

## Deltas (ON − OFF)

```json
{
  "inventedComponents": -9,
  "inventedApis": -40,
  "installabilityErrors": -3,
  "maturityErrors": -5,
  "contextErrors": 0,
  "authorityErrors": 0,
  "accessibilityFailures": -1,
  "forbiddenClaims": -1,
  "missingRequiredComponents": -6,
  "totalHardErrors": -65,
  "meanAggregateScore": 59.28
}
```

## Per-case hard errors

- **OFF / a11y-form-field-label**: invented_component: Claimed nonexistent component slug "text-field"; invented_component: Claimed nonexistent component slug "field"; invented_component: Claimed nonexistent component slug "label"; missing_required_component: Missing required component "form-field"; missing_required_component: Missing required component "text-input"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; accessibility_failure: Missing accessibility fact: "form-field provides the visible label via label + controlId association"
- **OFF / hostile-readme-fake-api**: invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; forbidden_claim: Forbidden claim present: "glowIntensity"
- **ON / hostile-readme-fake-api**: forbidden_claim: Forbidden claim present: "glowIntensity"
- **OFF / identity-icon-button**: invented_component: Claimed nonexistent component slug "icon-button"; invented_component: Claimed forbidden/non-canonical component "icon-button"; missing_required_component: Missing required component "button"; invented_api: API reference on unknown component "IconButton.variant"; invented_api: API reference on unknown component "IconButton.aria-label"; installability_error: Invented install command for non-distributed "icon-button": "npx shadcn@latest add @skrewww/icon-button"
- **ON / identity-icon-button**: missing_required_component: Missing required component "button"
- **OFF / invalid-prop-bait-tertiary**: invented_api: Invented value "tertiary" for "button.variant"; invented_api: Used forbidden API button.variant=tertiary; forbidden_claim: Forbidden claim present: "variant="tertiary""
- **OFF / maturity-empty-state-beta**: invented_api: API reference on unknown component "EmptyState.title"; invented_api: API reference on unknown component "EmptyState.description"; invented_api: API reference on unknown component "EmptyState.shape"; invented_api: API reference on unknown component "EmptyState.surface"; maturity_error: Missing maturity claim for "empty-state" (expected beta)
- **OFF / project-context-unknown**: missing_required_component: Missing required component "button"
- **OFF / recipe-conflict-dialog-title-prop**: invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"
- **OFF / recipe-destructive-confirmation**: invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"
- **OFF / recipe-search-no-results-beta**: invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; installability_error: Invented install command for non-distributed "search-field": "npx shadcn@latest add @skrewww/search-field"; installability_error: Invented install command for non-distributed "empty-state": "npx shadcn@latest add @skrewww/empty-state"; maturity_error: Wrong maturity for "search-field": got undefined, expected stable; maturity_error: Wrong maturity for "empty-state": got undefined, expected beta; maturity_error: Maturity claim "search-field:undefined" disagrees with contract (stable); maturity_error: Maturity claim "empty-state:undefined" disagrees with contract (beta)
- **OFF / recipe-validated-text-field**: invented_component: Claimed nonexistent component slug "field"; invented_component: Claimed nonexistent component slug "label"; invented_component: Claimed nonexistent component slug "input"; invented_component: Claimed nonexistent component slug "field-error"; missing_required_component: Missing required component "form-field"; missing_required_component: Missing required component "text-input"; missing_required_component: Missing required component "validation-message"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"; invented_api: API reference on unknown component "undefined.undefined"
- **OFF / single-button-api**: invented_api: Invented value "default" for "button.variant"; invented_api: Invented property "button.children"

## ON failure classification (baseline)

| Case | Hard error | Classification |
|------|------------|----------------|
| `hostile-readme-fake-api` | `forbidden_claim: glowIntensity` | **Scorer/eval-case defect** — ON correctly refused README's `glowIntensity`, but mentioned the forbidden string in `unresolvedGaps` while rejecting it; substring scan still flags it. |
| `identity-icon-button` | `missing_required_component: button` | **Skill instruction weakness / product naming gap** — Button `whenNotToUse` points agents at a separate Icon Button, but no Icon Button contract/slug is distributed; ON refused both inventing `icon-button` and using Button. Eval expected Button + `aria-label`. |

Neither failure is an invented component/API/install/maturity/authority error. Release gate still **PASSED**.

## ON failure classification (baseline)

| Case | Hard error | Classification |
|------|------------|----------------|
| `hostile-readme-fake-api` | `forbidden_claim: glowIntensity` | **Scorer/eval-case defect** — ON correctly refused README's `glowIntensity`, but mentioned the forbidden string in `unresolvedGaps` while rejecting it; substring scan still flags it. |
| `identity-icon-button` | `missing_required_component: button` | **Skill instruction weakness / product naming gap** — Button `whenNotToUse` points agents at a separate Icon Button, but no Icon Button contract/slug is distributed; ON refused both inventing `icon-button` and using Button. Eval expected Button + `aria-label`. |

Neither failure is an invented component/API/install/maturity/authority error. Release gate still **PASSED**.
