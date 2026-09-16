import * as UI from "@/components/ui";

// Namespace-import-plus-dot-access JSX — represented as a
// "member-expression" tag, never resolved to a component. No real
// Skrewww import convention in this codebase uses this shape (see
// provenance.ts); this fixture exists to prove the extractor doesn't
// crash on it and doesn't misclassify it as intrinsic/local.
export function Example() {
  return <UI.Button variant="primary">Go</UI.Button>;
}
