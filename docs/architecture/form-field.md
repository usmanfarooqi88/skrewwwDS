# Form field architecture

## Decision (2026-07-11)

Skrewww forms follow a **composed field pattern** — complete public field components for most product code, with FormField available for advanced grouping.

| Layer | Public API | Owns |
|-------|------------|------|
| **TextInput, Textarea, Select, SearchField, DatePicker** | Yes — preferred consumer imports | Label, helper, error, required indicator, and control semantics |
| **FormField** | Yes — advanced composition | Label, helper, error, required indicator, `aria-describedby` wiring for nested controls |
| **ValidationMessage** | Yes | Typed inline feedback (error, warning, success, info) |
| **TextInputControl, TextareaControl, SelectControl** | **No** — internal only | Control visuals and native element wiring |

## Figma naming

- Figma: **Form Field Wrapper**
- React: **FormField**
- Canonical documentation URL: `/components/form-field`
- `/components/form-field-wrapper` permanently redirects to the canonical page

## Preferred public usage

Use complete field components for single controls:

```tsx
import { TextInput } from "@/components/ui/TextInput";

<TextInput
  label="Email"
  supportingText="We will not share your email."
  error={error}
  name="email"
/>
```

Each complete field component composes FormField internally so consumers do not duplicate label or validation wiring.

## When to use FormField directly

Use FormField when one label wraps multiple related controls:

- Checkbox lists under one heading
- Custom grouped inputs that share one helper or error region

Do **not** import `TextInputControl`, `TextareaControl`, or `SelectControl` in application or documentation examples — those are internal building blocks.

## Open questions

- Should FormField support horizontal label layouts? **Unresolved in Figma — not implemented.**
- Should ValidationMessage iconography match Figma instance swaps exactly? **Info icon reuse noted in content/forms.ts.**
- Textarea min-height and resize behavior use temporary tokens pending Figma confirmation.
