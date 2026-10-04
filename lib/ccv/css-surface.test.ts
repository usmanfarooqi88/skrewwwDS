import { describe, expect, it } from "vitest";
import { analyzeCssSurface, readScriptSuppliedCustomProperties } from "@/lib/ccv/css-surface";

describe("CCV-1 CSS consumer surface", () => {
  it("extracts declared custom properties, uses and mode selectors", () => {
    const css = `
      :root { --a: 1px; --b: var(--a); }
      [data-skrewww-shape="pill"] { --a: 9999px; }
      [data-skrewww-surface="glass"] .card { backdrop-filter: blur(var(--b)); }
      .x { padding: calc(var(--a) * 2); }
    `;
    const surface = analyzeCssSurface([css]);
    expect(surface.declaredCustomProperties).toEqual(["--a", "--b"]);
    expect(surface.usedCustomProperties).toEqual(["--a", "--b"]);
    expect(surface.unresolvedWithoutFallback).toEqual([]);
    expect(surface.fallbackBackedUses).toEqual([]);
    expect(surface.modeSelectors).toEqual(['[data-skrewww-shape="pill"]', '[data-skrewww-surface="glass"]']);
  });

  it("never treats var(--x, fallback) as var(--x)", () => {
    const surface = analyzeCssSurface([`:root { --declared: 1; } .a { color: var(--c, #131316); } .b { margin: var(--d); } .c { gap: var(--declared); }`]);
    expect(surface.fallbackBackedUses).toEqual(["--c"]); // undeclared, literal fallback: not a failure
    expect(surface.unresolvedWithoutFallback).toEqual(["--d"]); // undeclared, bare: a true unresolved use
    expect(surface.usedCustomProperties).toEqual(["--c", "--d", "--declared"]);
  });

  it("a name used both bare and with a fallback is unresolved, not fallback-backed", () => {
    const surface = analyzeCssSurface([`.a { color: var(--x, red); } .b { color: var(--x); }`]);
    expect(surface.unresolvedWithoutFallback).toEqual(["--x"]);
    expect(surface.fallbackBackedUses).toEqual([]);
  });

  it("judges nested fallbacks lazily and correctly", () => {
    // outer undeclared, inner undeclared and bare → both unresolved
    expect(analyzeCssSurface([`.a { c: var(--x, var(--y)); }`]).unresolvedWithoutFallback).toEqual(["--x", "--y"]);
    // outer undeclared, inner has a literal fallback → both resolve through fallbacks
    const nested = analyzeCssSurface([`.a { c: var(--x, var(--y, 1px)); }`]);
    expect(nested.unresolvedWithoutFallback).toEqual([]);
    expect(nested.fallbackBackedUses).toEqual(["--x", "--y"]);
    // outer declared → its fallback is never evaluated, but the nested name is still "used"
    const lazy = analyzeCssSurface([`:root { --x: 1; } .a { c: var(--x, var(--never)); }`]);
    expect(lazy.unresolvedWithoutFallback).toEqual([]);
    expect(lazy.usedCustomProperties).toEqual(["--never", "--x"]);
  });

  it("ignores comments and resolves against alsoDeclared without reporting it as declared", () => {
    const css = `/* var(--ghost) and --ghost: 1; */ .a { c: var(--from-dependency); }`;
    const alone = analyzeCssSurface([css]);
    expect(alone.usedCustomProperties).toEqual(["--from-dependency"]);
    expect(alone.unresolvedWithoutFallback).toEqual(["--from-dependency"]);
    const resolved = analyzeCssSurface([css], { alsoDeclared: ["--from-dependency"] });
    expect(resolved.unresolvedWithoutFallback).toEqual([]);
    expect(resolved.declaredCustomProperties).toEqual([]); // the set this CSS declares itself
  });

  it("is deterministic and order independent", () => {
    const a = analyzeCssSurface([`:root{--b:1;--a:2}`, `.x{c:var(--q)}`]);
    const b = analyzeCssSurface([`.x{c:var(--q)}`, `:root{--b:1;--a:2}`]);
    expect(a).toEqual(b);
    expect(a.declaredCustomProperties).toEqual(["--a", "--b"]);
  });

  it("reads custom properties a script assigns itself, without subtracting them from the CSS facts", () => {
    const source = `<div style={{ "--slider-fill-percent": \`\${p}%\`, '--slider-size': "1rem", color: "red" }} />`;
    expect(readScriptSuppliedCustomProperties([source])).toEqual(["--slider-fill-percent", "--slider-size"]);
    expect(readScriptSuppliedCustomProperties(["const css = 'var(--not-a-key)'"])).toEqual([]);
  });
});
