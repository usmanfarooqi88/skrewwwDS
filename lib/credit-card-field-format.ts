/**
 * Presentation helpers for Credit Card Field.
 * Values store digit-only strings; display may insert grouping separators.
 * Not payment validation and not network brand detection.
 */

/** Max digit length covering common PAN ranges (incl. some 19-digit PANs). */
export const CREDIT_CARD_NUMBER_MAX_DIGITS = 19;
export const CREDIT_CARD_EXPIRY_MAX_DIGITS = 4;
export const CREDIT_CARD_CVC_MAX_DIGITS = 4;

export function digitsOnly(value: string, max: number): string {
  return value.replace(/\D/g, "").slice(0, max);
}

/** Groups digits in fours with spaces for display (Figma visual grouping). */
export function formatCardNumberDisplay(digits: string): string {
  const clean = digitsOnly(digits, CREDIT_CARD_NUMBER_MAX_DIGITS);
  return clean.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** MM/YY display from up to 4 digits. */
export function formatExpiryDisplay(digits: string): string {
  const clean = digitsOnly(digits, CREDIT_CARD_EXPIRY_MAX_DIGITS);
  if (clean.length <= 2) return clean;
  return `${clean.slice(0, 2)}/${clean.slice(2)}`;
}

export function formatCvcDisplay(digits: string): string {
  return digitsOnly(digits, CREDIT_CARD_CVC_MAX_DIGITS);
}

/**
 * Map caret index in a formatted string back after reformatting.
 * Counts digits before the caret, then finds that digit offset in next.
 */
export function mapCaretAfterFormat(
  previousFormatted: string,
  caret: number,
  nextFormatted: string,
): number {
  const digitsBefore = digitsOnly(previousFormatted.slice(0, caret), 64).length;
  if (digitsBefore === 0) return 0;
  let seen = 0;
  for (let i = 0; i < nextFormatted.length; i += 1) {
    if (/\d/.test(nextFormatted[i]!)) {
      seen += 1;
      if (seen === digitsBefore) return i + 1;
    }
  }
  return nextFormatted.length;
}
