import { describe, expect, it } from "vitest";
import { environmentJudgement, recordedChecks } from "@/lib/ccv/css/checks";
import { assertionKey, isConsoleNoise, judgeFocusVisible, judgeFoundationActive, judgeRecorded, judgeRuntimeSupplied, judgeScenario } from "@/lib/ccv/css/runtime-judge";

const focus = { reached: true, tabPresses: 1, matchesFocusVisible: true, outlineStyle: "solid", outlineWidth: "2px", outlineColor: "rgb(108, 76, 242)", boxShadow: "none" };
const scenario = { name: "x", kind: "render" as const, httpStatus: 200, renderedElements: 5, consoleErrors: [] as string[] };

describe("CCV-4 runtime judgements (pure; evidence comes from real Chromium)", () => {
  it("Foundation active passes; mutation: an empty :root property is CSS_RUNTIME_UNRESOLVED", () => {
    expect(judgeFoundationActive({ checked: 10, empty: [] }).status).toBe("pass");
    expect(judgeFoundationActive({ checked: 10, empty: ["--semantic-focus-ring"] })).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
  });
  it("mutation: Foundation not loaded at all (nothing to check) fails", () => {
    expect(judgeFoundationActive({ checked: 0, empty: [] })).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
  });
  it("focus-visible passes with an outline; mutation: outline none → CSS_RUNTIME_UNRESOLVED", () => {
    expect(judgeFocusVisible(focus).status).toBe("pass");
    expect(judgeFocusVisible({ ...focus, outlineStyle: "none" })).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
    expect(judgeFocusVisible({ ...focus, outlineColor: "rgba(0, 0, 0, 0)" })).toMatchObject({ status: "fail" });
    expect(judgeFocusVisible({ ...focus, outlineStyle: "none", boxShadow: "rgb(0, 0, 255) 0px 0px 0px 2px" }).status).toBe("pass");
  });
  it("mutation: control never reached by keyboard → INTERACTION_FAILED", () => {
    expect(judgeFocusVisible({ ...focus, reached: false, tabPresses: 20 })).toMatchObject({ status: "fail", failureCode: "INTERACTION_FAILED" });
  });
  it("runtime-supplied: no scenario → unknown; mutation: no element carries the value → CSS_RUNTIME_UNRESOLVED", () => {
    expect(judgeRuntimeSupplied({ prop: "--p", elementsWithValue: 0 }).status).toBe("unknown");
    expect(judgeRuntimeSupplied({ prop: "--p", scenario: "slider", elementsWithValue: 0 })).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
    expect(judgeRuntimeSupplied({ prop: "--p", scenario: "slider", elementsWithValue: 2, sample: "40%" }).status).toBe("pass");
  });
  it("T2 render: mutation: an HTTP 500 route or an empty page fails", () => {
    expect(judgeScenario(scenario).status).toBe("pass");
    expect(judgeScenario({ ...scenario, httpStatus: 500 })).toMatchObject({ status: "fail", failureCode: "INTERACTION_FAILED" });
    expect(judgeScenario({ ...scenario, renderedElements: 0 })).toMatchObject({ status: "fail" });
  });
  it("mutation: a critical console error fails; favicon noise does not", () => {
    expect(judgeScenario({ ...scenario, consoleErrors: ["Uncaught TypeError: x is undefined"] })).toMatchObject({ status: "fail", failureCode: "INTERACTION_FAILED" });
    expect(isConsoleNoise("GET /favicon.ico 404")).toBe(true);
    expect(judgeScenario({ ...scenario, consoleErrors: ["Failed to load resource: /favicon.ico 404"] }).status).toBe("pass");
  });
  it("T3 browserAssert: mutation: a style assertion error → CSS_RUNTIME_UNRESOLVED, a behaviour error → INTERACTION_FAILED", () => {
    expect(judgeScenario({ ...scenario, kind: "runtime", assertionError: "slider: thumb background did not resolve" })).toMatchObject({ failureCode: "CSS_RUNTIME_UNRESOLVED" });
    expect(judgeScenario({ ...scenario, kind: "runtime", assertionError: "combobox: listbox did not open after ArrowDown" })).toMatchObject({ failureCode: "INTERACTION_FAILED" });
  });
  it("recorded smoke assertions keep their names; mutation: a failed Shape assertion → CSS_RUNTIME_UNRESOLVED", () => {
    expect(assertionKey("Shape pill: computed behavior")).toBe("shape-pill");
    expect(judgeRecorded({ name: "Surface glass: computed behavior", ok: false, detail: "backdrop=none" })).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
    expect(judgeRecorded({ name: "Dialog: Escape closes it and focus returns to the trigger", ok: false })).toMatchObject({ failureCode: "INTERACTION_FAILED" });
    const checks = recordedChecks((c, k) => `npm:p:${c}:${k}`, "smoke", [{ name: "Shape pill: computed behavior", ok: true }, { name: "Shape pill: computed behavior", ok: true }]);
    expect(checks.map((c) => c.checkId)).toEqual(["npm:p:runtime:smoke-shape-pill", "npm:p:runtime:smoke-shape-pill-2"]);
  });
  it("a browser that cannot start is UNKNOWN / ENVIRONMENT_ERROR, never a pass or a contract fail", () => {
    expect(environmentJudgement("chromium: executable doesn't exist")).toEqual({ status: "unknown", failureCode: "ENVIRONMENT_ERROR", detail: "chromium: executable doesn't exist" });
  });
});
