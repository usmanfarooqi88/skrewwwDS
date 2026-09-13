/**
 * Figma source for Phone Number Field (CE-1E).
 * Pro Forms page component set — verified read-only via Figma MCP.
 */
export const PHONE_NUMBER_FIELD_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2776";

/** Component-set node ID — Forms/Phone Number Field. */
export const PHONE_NUMBER_FIELD_FIGMA_COMPONENT_SET_NODE_ID = "2024:2776";

/** Forms page containing the set. */
export const PHONE_NUMBER_FIELD_FIGMA_PAGE_NODE_ID = "2002:2368";

/**
 * Verified contract (2026-09-14):
 * - Compound: Country Selector + Number Input (two adjacent bordered controls)
 * - Gap spacing/8 between controls
 * - Country Selector: Flag (placeholder) + Dial Code TEXT + Icon/CaretDown
 * - Number Input: Value TEXT (placeholder demo “Phone number”)
 * - State: Default / Focused / Error / Disabled (4)
 * - Tokens: Text Input / Select family
 * - Flag is a generic two-stripe placeholder — not real national flags
 *
 * Not in the set:
 * Size axis, Shape/Surface axes, country list data, phone formatting rules,
 * SMS/OTP/carrier verification.
 */
export const PHONE_NUMBER_FIELD_FIGMA_STATES = [
  "Default",
  "Focused",
  "Error",
  "Disabled",
] as const;

export const PHONE_NUMBER_FIELD_FIGMA_VARIANT_COUNT =
  PHONE_NUMBER_FIELD_FIGMA_STATES.length;

export const PHONE_NUMBER_FIELD_FIGMA_AUDIT_STATUS = "verified-2026-09-14" as const;
