import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  meetsWcagAaNormalText,
  parseHexColor,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/wcag-contrast";

describe("wcag-contrast", () => {
  it("computes known black-on-white contrast", () => {
    expect(contrastRatio(parseHexColor("#000000"), parseHexColor("#ffffff"))).toBeCloseTo(21, 0);
  });

  it("evaluates AA threshold for normal text", () => {
    expect(meetsWcagAaNormalText(parseHexColor("#131316"), parseHexColor("#ffffff"))).toBe(true);
    expect(meetsWcagAaNormalText(parseHexColor("#ffffff"), parseHexColor("#ededf0"))).toBe(false);
    expect(WCAG_AA_NORMAL_TEXT).toBe(4.5);
  });
});
