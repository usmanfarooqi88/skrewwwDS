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

## Composition rules (verified against source, 2026-10-03)

- **A complete field is the whole field.** `TextInput` renders `FormField` internally (label, supporting text, required indicator, error) and requires its own `label`.
  Never wrap `TextInput` (or another complete field) in `FormField` — that duplicates the label — and never add a separate label or `ValidationMessage` for the
  same error. `FormField`'s `children` is a render function, so a JSX child is not valid either.
- **Do not pass your own `aria-describedby` / `aria-invalid` to a complete field.** The complete field spreads caller props after its own wiring, so they replace it.
- **A standalone `ValidationMessage` has no supported association with a complete field's input**, so it is not paired with `TextInput`. Use it beside a custom
  control wired through `FormField`'s render prop, or as a form-level message.
- **Announcement.** `FormField` renders its `error` through `ValidationMessage` with `announce="off"`; the error reaches assistive technology through
  `aria-invalid` and `aria-describedby`, not a live region. For a standalone `ValidationMessage`, keep the default `"off"` for an error already on screen at first
  render and use `"assertive"` only for an error introduced after the page is shown (for example after a failed submit). Never render assertive on first paint.
- **`FormField` direct use in the public npm pilot.** The pilot (`@skrewww/react`) exports no checkbox, select or textarea, and `TextInputControl` is internal, so
  `FormField` can only be demonstrated there with a native control you supply through the render prop (it wires `controlId`, `describedBy`, `invalid`).
  Complete field components for other controls arrive with a wider package.

## Open questions

- Should FormField support horizontal label layouts? **Unresolved in Figma — not implemented.**
- Should ValidationMessage iconography match Figma instance swaps exactly? **Info icon reuse noted in content/forms.ts.**
- Textarea min-height and resize behavior use temporary tokens pending Figma confirmation.
