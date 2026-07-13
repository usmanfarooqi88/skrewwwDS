# Token source of truth

## Strategy: Option C with drift guards

Tailwind theme colors in `tailwind.config.ts` are **documentation-shell-only**. Public React components use CSS modules backed by `styles/tokens.css`.

This pass does not rewrite Tailwind to consume CSS variables (Option A) or generate Tailwind from a shared build pipeline (Option B). Instead:

1. **Public components** — must use semantic/component tokens from `styles/tokens.css`.
2. **Tailwind** — used for docs layout chrome (spacing utilities, ink/brand palette in app shell).
3. **Drift tests** — critical duplicated primitives are compared in `lib/project-configuration.test.ts`.

## Authority table

| Token / value | Figma authority | React authority | Tailwind | Classification |
|---------------|-----------------|-----------------|----------|----------------|
| Brand 500 `#6C4CF2` | `color/brand/500` when MCP-verified | `--primitive-color-brand-500` | `theme.colors.brand.500` | Verified primitive; Tailwind duplicate guarded by test |
| Semantic action primary | Figma semantic variable | `--semantic-action-primary` | — | Alias in tokens.css |
| Focus ring | Figma semantic | `--semantic-focus-ring` | — | Alias |
| Ink neutrals | Figma neutral ramp | — | `theme.colors.ink.*` | Docs-shell Tailwind palette; not used in public component modules |
| Combobox popup tokens | Unresolved MCP | `--combobox-popup-*` | — | Temporary / alias to Popover |

## Rules

- Do not introduce new hardcoded hex values in public component CSS modules.
- Electric Violet brand primary must stay `#6C4CF2` / `#6c4cf2` across Tailwind and tokens until Figma MCP verifies a change.
- Dark/light semantic usage in components prefers `--semantic-*` tokens, not raw Tailwind palette classes inside `components/ui/`.
- Tailwind opacity modifiers on duplicated brand tokens must remain valid if Tailwind values change.

## Future work

- Map Tailwind docs-shell colors to CSS custom properties once a single token export pipeline exists.
- Expand parity tests when new primitives are duplicated.
