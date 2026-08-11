# Skrewww Agent Guidelines

## Figma Safety Rules

- Figma is authoritative for approved visual/component behavior.
- Never modify Figma files unless the user explicitly requests a Figma write.
- Default Figma MCP usage is READ-ONLY inspection.
- Before changing code for Figma parity, inspect the relevant Figma node/component/variables through MCP.
- Do not infer design intent from code when Figma data is available.
- Do not silently resolve Figma ↔ code disagreements.
- Report mismatches and ask for approval when the correct behavior represents a design decision.
- Judge parity primarily by resolved/rendered behavior, not merely matching token names.
- Do not rename, delete, detach, publish, restructure, or mass-edit Figma components/variables without explicit approval.
- Every parity fix must be scoped to the relevant component and regression-tested.

## Change Safety

- Before editing, inspect the relevant implementation, tests, and documentation.
- Make the smallest change necessary to satisfy the task.
- Do not refactor unrelated code.
- Do not change public behavior, design-system semantics, tokens, component APIs, or registry contracts unless explicitly required.
- Preserve existing working behavior unless the requested change requires otherwise.
- For bug fixes, add or update a focused regression test when practical.
- After implementation, report exactly what changed and what was verified.
- Never claim verification passed if a command failed, timed out, or could not run.
