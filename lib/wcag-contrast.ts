/** sRGB channel 0–255 → linear luminance 0–1 (WCAG 2.x). */
function channelLuminance(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number },
): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

/** `color-mix(in srgb, base pct%, transparent)` over a white canvas. */
export function mixBrandOverWhite(brandHex: string, percent: number): { r: number; g: number; b: number } {
  const brand = parseHexColor(brandHex);
  const ratio = percent / 100;
  return {
    r: Math.round(brand.r * ratio + 255 * (1 - ratio)),
    g: Math.round(brand.g * ratio + 255 * (1 - ratio)),
    b: Math.round(brand.b * ratio + 255 * (1 - ratio)),
  };
}

export const WCAG_AA_NORMAL_TEXT = 4.5;

export function meetsWcagAaNormalText(
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number },
): boolean {
  return contrastRatio(foreground, background) >= WCAG_AA_NORMAL_TEXT;
}
