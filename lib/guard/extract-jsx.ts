import * as ts from "typescript";
import type { ImportFact, JsxAttributeFact, JsxElementFact, JsxTagResolution } from "@/lib/guard/types";
import type { ParsedSource } from "@/lib/guard/parse-source";

/**
 * Structural JSX extraction. Resolves a JSX tag's *local identifier* back
 * to an `ImportFact` when one exists in the same file — this is purely
 * structural name-to-binding resolution, never a provenance decision
 * (see provenance.ts for "is this import actually a Skrewww path").
 *
 * Deliberately does NOT resolve through wrapper components: given
 *
 *   function MyButton(props) { return <Button {...props} />; }
 *   <MyButton fakeProp="x" />
 *
 * the outer `<MyButton fakeProp="x" />` resolves to `local-or-unresolved`
 * (no import binds `MyButton`) — it is never traced into `MyButton`'s own
 * body to discover the inner `<Button>`. The inner `<Button {...props} />`
 * is extracted as its own, separate `JsxElementFact`, correctly resolved
 * to the real `Button` import, with `hasSpreadAttributes: true` — so a
 * future rule sees two independent facts, exactly matching the real
 * structure, and never conflates the wrapper's own call site with the
 * primitive's. See docs/architecture/guard-readiness-audit.md's G-0
 * brief Part 11 ("Wrapper Component Safety") — this is the single
 * highest-value false-positive protection this module provides, achieved
 * simply by never following control flow, only ever reading each JSX
 * element's own literal tag + attribute list.
 */

function resolveTagName(
  tagNode: ts.JsxTagNameExpression,
  importsByLocalName: Map<string, ImportFact>,
): JsxTagResolution {
  if (ts.isIdentifier(tagNode)) {
    const name = tagNode.text;
    // JSX convention (not a Skrewww-specific rule): a tag starting with a
    // lowercase letter is always a native intrinsic element (`<div>`,
    // `<button>`), never resolved against imports — matches how React's
    // own JSX runtime distinguishes the two cases.
    if (name.length > 0 && name[0] === name[0].toLowerCase() && name[0] !== name[0].toUpperCase()) {
      return { kind: "intrinsic", tagName: name };
    }
    const imported = importsByLocalName.get(name);
    if (imported) {
      return { kind: "imported", import: imported };
    }
    return { kind: "local-or-unresolved", tagName: name };
  }
  // <UI.Button /> shape (PropertyAccessExpression) or a deeper
  // ThisExpression-qualified form. Represented, not resolved — see the
  // G-0 brief Part 8: no real Skrewww import convention in this codebase
  // produces a namespace-import-plus-dot-access usage, so building real
  // resolution here would be speculative schema growth ahead of any
  // proven need.
  return { kind: "member-expression", text: tagNode.getText() };
}

function extractAttributes(
  attributes: ts.JsxAttributes,
  toRange: ParsedSource["toRange"],
): JsxAttributeFact[] {
  return attributes.properties.map((prop): JsxAttributeFact => {
    if (ts.isJsxSpreadAttribute(prop)) {
      return { valueKind: "spread", range: toRange(prop.getStart(), prop.getEnd()) };
    }

    // ts.isJsxAttribute(prop) is the only remaining case in JsxAttributeLike.
    const name = prop.name.getText();
    const range = toRange(prop.getStart(), prop.getEnd());

    if (!prop.initializer) {
      return { valueKind: "boolean-shorthand", name, range };
    }

    if (ts.isStringLiteral(prop.initializer)) {
      return { valueKind: "static-string", name, value: prop.initializer.text, range };
    }

    // JsxExpression container (`size={...}`) — classified as dynamic
    // regardless of what the expression actually contains (even a
    // literal like `size={"sm"}`), matching the G-0 brief's own example
    // (`<Button size={value} />`) exactly. Extracting a nested string
    // literal here would be a small precision gain not asked for and not
    // needed by any locked v0.1 rule (which only ever checks attribute
    // *names*, never values) — avoided to keep this extractor's behavior
    // simple and easy to reason about.
    return { valueKind: "dynamic", name, range };
  });
}

export function extractJsxElements(parsed: ParsedSource, imports: ImportFact[]): JsxElementFact[] {
  const { sourceFile, toRange } = parsed;
  const importsByLocalName = new Map(imports.map((fact) => [fact.localName, fact]));
  const facts: JsxElementFact[] = [];

  function recordElement(
    tagNode: ts.JsxTagNameExpression,
    attributesNode: ts.JsxAttributes,
    range: { start: number; end: number },
  ) {
    const attributes = extractAttributes(attributesNode, toRange);
    facts.push({
      resolution: resolveTagName(tagNode, importsByLocalName),
      attributes,
      hasSpreadAttributes: attributes.some((attr) => attr.valueKind === "spread"),
      range: toRange(range.start, range.end),
    });
  }

  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node)) {
      recordElement(node.tagName, node.attributes, { start: node.getStart(), end: node.getEnd() });
    } else if (ts.isJsxElement(node)) {
      const opening = node.openingElement;
      recordElement(opening.tagName, opening.attributes, {
        start: opening.getStart(),
        end: opening.getEnd(),
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return facts;
}
