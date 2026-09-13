/**
 * Figma source for Credit Card Field (CE-1D).
 * Pro Forms page component set — verified read-only via Figma MCP.
 */
export const CREDIT_CARD_FIELD_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2714";

/** Component-set node ID — Forms/Credit Card Field. */
export const CREDIT_CARD_FIELD_FIGMA_COMPONENT_SET_NODE_ID = "2024:2714";

/** Forms page containing the set. */
export const CREDIT_CARD_FIELD_FIGMA_PAGE_NODE_ID = "2002:2368";

/**
 * Verified contract (2026-09-14):
 * - Compound visual control: Card Number | Expiry | CVC in one shell
 * - Generic Icon/CreditCard only — no Visa/Mastercard brand detection
 * - State axis: Default / Focused / Error / Disabled (4 variants)
 * - TEXT props: Card Number, Expiry, CVC (independently editable)
 * - Tokens: same family as Text Input (component/text-input/*, radius/control)
 * - Layout: spacing/8 gap, spacing/12×8 padding, 1px color/neutral/200 dividers
 * - Height demo ≈ 36px (Text Input md)
 *
 * Not in the set (UNKNOWN / out of scope for this component):
 * Size axis, Shape/Surface axes (inherit via Text Input token family),
 * Success/Warning, read-only, brand logos, payment APIs, Luhn validation.
 */
export const CREDIT_CARD_FIELD_FIGMA_STATES = [
  "Default",
  "Focused",
  "Error",
  "Disabled",
] as const;

export const CREDIT_CARD_FIELD_FIGMA_VARIANT_COUNT =
  CREDIT_CARD_FIELD_FIGMA_STATES.length;

export const CREDIT_CARD_FIELD_FIGMA_AUDIT_STATUS = "verified-2026-09-14" as const;

/** Decorative leading glyph — deliberately not a network trademark. */
export const CREDIT_CARD_FIELD_FIGMA_ICON = "Icon/CreditCard" as const;
