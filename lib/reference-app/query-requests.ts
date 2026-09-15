import type {
  ReferenceOwner,
  ReferenceRequest,
  RequestPriority,
  RequestStatus,
} from "@/lib/reference-app/types";
import type { DataTableSortState } from "@/lib/use-data-table-sort";

export type RequestSortColumn =
  | "title"
  | "status"
  | "owner"
  | "priority"
  | "dueDate"
  | "updatedAt";

export type RequestFilters = {
  status: RequestStatus | "";
  ownerId: string;
  priority: RequestPriority | "";
  /** Inclusive upper bound on dueDate (YYYY-MM-DD). Empty = no due filter. */
  dueOnOrBefore: string;
};

export const EMPTY_REQUEST_FILTERS: RequestFilters = {
  status: "",
  ownerId: "",
  priority: "",
  dueOnOrBefore: "",
};

export const REQUEST_PAGE_SIZE = 6;

const STATUS_ORDER: Record<RequestStatus, number> = {
  open: 0,
  in_progress: 1,
  resolved: 2,
  archived: 3,
};

const PRIORITY_ORDER: Record<RequestPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export function countActiveRequestFilters(filters: RequestFilters): number {
  return (
    Number(Boolean(filters.status)) +
    Number(Boolean(filters.ownerId)) +
    Number(Boolean(filters.priority)) +
    Number(Boolean(filters.dueOnOrBefore))
  );
}

export function hasActiveRequestFilters(filters: RequestFilters): boolean {
  return countActiveRequestFilters(filters) > 0;
}

export function searchReferenceRequests(
  requests: readonly ReferenceRequest[],
  ownersById: ReadonlyMap<string, ReferenceOwner>,
  query: string,
): ReferenceRequest[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...requests];

  return requests.filter((request) => {
    const ownerName = ownersById.get(request.ownerId)?.name ?? "";
    return (
      request.title.toLowerCase().includes(normalized) ||
      request.id.toLowerCase().includes(normalized) ||
      ownerName.toLowerCase().includes(normalized)
    );
  });
}

export function filterReferenceRequests(
  requests: readonly ReferenceRequest[],
  filters: RequestFilters,
): ReferenceRequest[] {
  return requests.filter((request) => {
    if (filters.status && request.status !== filters.status) return false;
    if (filters.ownerId && request.ownerId !== filters.ownerId) return false;
    if (filters.priority && request.priority !== filters.priority) return false;
    if (filters.dueOnOrBefore && request.dueDate > filters.dueOnOrBefore) return false;
    return true;
  });
}

function compareRequests(
  a: ReferenceRequest,
  b: ReferenceRequest,
  column: RequestSortColumn,
  ownersById: ReadonlyMap<string, ReferenceOwner>,
): number {
  switch (column) {
    case "title":
      return a.title.localeCompare(b.title);
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "owner": {
      const left = ownersById.get(a.ownerId)?.name ?? "";
      const right = ownersById.get(b.ownerId)?.name ?? "";
      return left.localeCompare(right);
    }
    case "priority":
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    case "dueDate":
      return a.dueDate.localeCompare(b.dueDate);
    case "updatedAt":
      return a.updatedAt.localeCompare(b.updatedAt);
    default:
      return 0;
  }
}

export function sortReferenceRequests(
  requests: readonly ReferenceRequest[],
  sortState: DataTableSortState<RequestSortColumn>,
  ownersById: ReadonlyMap<string, ReferenceOwner>,
): ReferenceRequest[] {
  if (!sortState.column) return [...requests];
  const column = sortState.column;
  const factor = sortState.direction === "ascending" ? 1 : -1;
  return [...requests].sort((a, b) => {
    const result = compareRequests(a, b, column, ownersById);
    if (result !== 0) return result * factor;
    return a.id.localeCompare(b.id) * factor;
  });
}

export function paginateReferenceRequests(
  requests: readonly ReferenceRequest[],
  page: number,
  pageSize: number = REQUEST_PAGE_SIZE,
): { rows: ReferenceRequest[]; page: number; totalPages: number; total: number } {
  const total = requests.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(page, 1), total === 0 ? 1 : totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    rows: requests.slice(start, start + pageSize),
    page: safePage,
    totalPages: total === 0 ? 1 : totalPages,
    total,
  };
}

/**
 * Canonical pipeline: fixtures → search → filters → sort → pagination.
 * Never mutates the input fixture array.
 */
export function queryReferenceRequests(options: {
  requests: readonly ReferenceRequest[];
  owners: readonly ReferenceOwner[];
  search: string;
  filters: RequestFilters;
  sortState: DataTableSortState<RequestSortColumn>;
  page: number;
  pageSize?: number;
}): {
  rows: ReferenceRequest[];
  page: number;
  totalPages: number;
  total: number;
  matched: ReferenceRequest[];
} {
  const ownersById = new Map(options.owners.map((owner) => [owner.id, owner]));
  const searched = searchReferenceRequests(options.requests, ownersById, options.search);
  const filtered = filterReferenceRequests(searched, options.filters);
  const sorted = sortReferenceRequests(filtered, options.sortState, ownersById);
  const paged = paginateReferenceRequests(sorted, options.page, options.pageSize);
  return { ...paged, matched: sorted };
}
