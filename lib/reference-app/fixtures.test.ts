import { describe, expect, it } from "vitest";
import {
  getReferenceOwnerById,
  getReferenceRequestById,
  getWorkspaceSummary,
  REFERENCE_LABELS,
  REFERENCE_OWNERS,
  REFERENCE_REQUESTS,
} from "@/lib/reference-app/fixtures";
import { isReferenceNavItemActive, REFERENCE_NAV_ITEMS } from "@/lib/reference-app/nav";

describe("reference-app fixtures", () => {
  it("exposes stable request IDs and deterministic summary counts", () => {
    expect(REFERENCE_REQUESTS).toHaveLength(18);
    expect(REFERENCE_REQUESTS.map((r) => r.id)).toEqual([
      "req_001",
      "req_002",
      "req_003",
      "req_004",
      "req_005",
      "req_006",
      "req_007",
      "req_008",
      "req_009",
      "req_010",
      "req_011",
      "req_012",
      "req_013",
      "req_014",
      "req_015",
      "req_016",
      "req_017",
      "req_018",
    ]);
    expect(getWorkspaceSummary()).toEqual({
      openCount: 7,
      inProgressCount: 5,
      resolvedThisWeek: 4,
      totalCount: 18,
    });
  });

  it("resolves owners and requests by stable IDs", () => {
    expect(getReferenceRequestById("req_001")?.title).toBe(
      "Reset SSO session for finance team",
    );
    expect(getReferenceOwnerById("usr_002")?.name).toBe("Jonah Park");
    expect(getReferenceRequestById("missing")).toBeUndefined();
  });

  it("keeps owners and labels fictional and non-empty", () => {
    expect(REFERENCE_OWNERS).toHaveLength(3);
    expect(REFERENCE_LABELS).toHaveLength(4);
    for (const owner of REFERENCE_OWNERS) {
      expect(owner.id).toMatch(/^usr_/);
      expect(owner.initials).toHaveLength(2);
    }
  });
});

describe("reference-app nav", () => {
  it("marks exact routes active without prefix collisions", () => {
    expect(isReferenceNavItemActive("/reference", REFERENCE_NAV_ITEMS[0])).toBe(true);
    expect(isReferenceNavItemActive("/reference/data", REFERENCE_NAV_ITEMS[0])).toBe(false);
    expect(isReferenceNavItemActive("/reference/data", REFERENCE_NAV_ITEMS[1])).toBe(true);
    expect(isReferenceNavItemActive("/reference/new", REFERENCE_NAV_ITEMS[2])).toBe(true);
    expect(isReferenceNavItemActive("/reference/settings", REFERENCE_NAV_ITEMS[3])).toBe(true);
  });

  it("lists only planned shell destinations", () => {
    expect(REFERENCE_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/reference",
      "/reference/data",
      "/reference/new",
      "/reference/settings",
    ]);
  });
});
