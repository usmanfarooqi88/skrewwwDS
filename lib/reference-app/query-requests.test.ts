import { describe, expect, it } from "vitest";
import {
  REFERENCE_OWNERS,
  REFERENCE_REQUESTS,
} from "@/lib/reference-app/fixtures";
import {
  EMPTY_REQUEST_FILTERS,
  filterReferenceRequests,
  paginateReferenceRequests,
  queryReferenceRequests,
  REQUEST_PAGE_SIZE,
  searchReferenceRequests,
  sortReferenceRequests,
} from "@/lib/reference-app/query-requests";

const ownersById = new Map(REFERENCE_OWNERS.map((owner) => [owner.id, owner]));

describe("queryReferenceRequests pipeline", () => {
  it("does not mutate the fixture array", () => {
    const before = REFERENCE_REQUESTS.map((r) => r.id);
    queryReferenceRequests({
      requests: REFERENCE_REQUESTS,
      owners: REFERENCE_OWNERS,
      search: "SSO",
      filters: { ...EMPTY_REQUEST_FILTERS, status: "open" },
      sortState: { column: "title", direction: "ascending" },
      page: 1,
    });
    expect(REFERENCE_REQUESTS.map((r) => r.id)).toEqual(before);
  });

  it("searches case-insensitively across title, id, and owner", () => {
    const byTitle = searchReferenceRequests(REFERENCE_REQUESTS, ownersById, "sso");
    expect(byTitle.map((r) => r.id)).toEqual(["req_001"]);

    const byId = searchReferenceRequests(REFERENCE_REQUESTS, ownersById, "REQ_012");
    expect(byId.map((r) => r.id)).toEqual(["req_012"]);

    const byOwner = searchReferenceRequests(REFERENCE_REQUESTS, ownersById, "amina");
    expect(byOwner.length).toBeGreaterThan(0);
    expect(byOwner.every((r) => r.ownerId === "usr_001")).toBe(true);
  });

  it("combines filters with AND semantics", () => {
    const filtered = filterReferenceRequests(REFERENCE_REQUESTS, {
      status: "open",
      ownerId: "usr_001",
      priority: "high",
      dueOnOrBefore: "2026-09-18",
    });
    expect(filtered.map((r) => r.id)).toEqual(["req_001", "req_008"]);
  });

  it("sorts deterministically with stable id tie-break", () => {
    const ascending = sortReferenceRequests(
      REFERENCE_REQUESTS,
      { column: "priority", direction: "ascending" },
      ownersById,
    );
    expect(ascending[0]?.priority).toBe("low");
    expect(ascending[ascending.length - 1]?.priority).toBe("high");

    const byDue = sortReferenceRequests(
      REFERENCE_REQUESTS,
      { column: "dueDate", direction: "ascending" },
      ownersById,
    );
    expect(byDue[0]?.dueDate <= byDue[1]!.dueDate).toBe(true);
  });

  it("paginates with a safe page bound", () => {
    const page1 = paginateReferenceRequests(REFERENCE_REQUESTS, 1, REQUEST_PAGE_SIZE);
    expect(page1.rows).toHaveLength(REQUEST_PAGE_SIZE);
    expect(page1.total).toBe(18);
    expect(page1.totalPages).toBe(3);

    const overflow = paginateReferenceRequests(REFERENCE_REQUESTS, 99, REQUEST_PAGE_SIZE);
    expect(overflow.page).toBe(3);
    expect(overflow.rows).toHaveLength(6);

    const empty = paginateReferenceRequests([], 4, REQUEST_PAGE_SIZE);
    expect(empty).toEqual({ rows: [], page: 1, totalPages: 1, total: 0 });
  });

  it("runs search → filters → sort → pagination in order", () => {
    const result = queryReferenceRequests({
      requests: REFERENCE_REQUESTS,
      owners: REFERENCE_OWNERS,
      search: "Add",
      filters: { ...EMPTY_REQUEST_FILTERS, status: "open" },
      sortState: { column: "title", direction: "ascending" },
      page: 1,
    });
    expect(result.matched.map((r) => r.id)).toEqual(["req_005", "req_015"]);
    expect(result.matched.every((r) => r.status === "open")).toBe(true);
    expect(result.matched[0]!.title.localeCompare(result.matched[1]!.title)).toBeLessThanOrEqual(0);
  });
});
