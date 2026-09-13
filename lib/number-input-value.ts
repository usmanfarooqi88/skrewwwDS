/**
 * Number Input value helpers — draft text vs committed number | null.
 * Constraints (min/max/step) apply on commit (blur / step / arrows), not every keystroke.
 */

export function countDecimals(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  const text = String(step);
  const i = text.indexOf(".");
  return i === -1 ? 0 : text.length - i - 1;
}

export function clampNumber(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function snapToStep(raw: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) {
    return clampNumber(raw, min, max);
  }
  const decimals = countDecimals(step);
  const origin = Number.isFinite(min) ? min : 0;
  const steps = Math.round((raw - origin) / step);
  const snapped = origin + steps * step;
  const rounded = decimals > 0 ? Number(snapped.toFixed(decimals)) : Math.round(snapped);
  return clampNumber(rounded, min, max);
}

/** Empty / intermediate drafts allowed while typing; committed values are number | null. */
export function isAllowedNumberDraft(text: string): boolean {
  if (text === "" || text === "-" || text === "." || text === "-.") return true;
  return /^-?\d*(\.\d*)?$/.test(text);
}

export function parseNumberDraft(
  text: string,
): { kind: "empty" } | { kind: "valid"; value: number } | { kind: "intermediate" } {
  const trimmed = text.trim();
  if (trimmed === "") return { kind: "empty" };
  if (trimmed === "-" || trimmed === "." || trimmed === "-." || /^-?\d+\.$/.test(trimmed)) {
    return { kind: "intermediate" };
  }
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return { kind: "intermediate" };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { kind: "intermediate" };
  return { kind: "valid", value };
}

export function formatCommittedNumber(value: number | null): string {
  if (value === null) return "";
  return String(value);
}

export function commitNumberDraft(
  text: string,
  min: number,
  max: number,
  step: number,
  previous: number | null,
): number | null {
  const parsed = parseNumberDraft(text);
  if (parsed.kind === "empty") return null;
  if (parsed.kind === "intermediate") return previous;
  return snapToStep(parsed.value, min, max, step);
}

export function stepNumber(
  current: number | null,
  direction: 1 | -1,
  min: number,
  max: number,
  step: number,
): number {
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  if (current === null) {
    // First step from empty lands on the nearer bound (min for up, max for down).
    const landing =
      direction > 0
        ? Number.isFinite(min)
          ? min
          : 0
        : Number.isFinite(max)
          ? max
          : 0;
    return snapToStep(landing, min, max, safeStep);
  }
  const decimals = countDecimals(safeStep);
  const raw = current + direction * safeStep;
  const rounded = decimals > 0 ? Number(raw.toFixed(decimals)) : raw;
  return snapToStep(rounded, min, max, safeStep);
}
