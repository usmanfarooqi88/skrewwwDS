import type {
  ReferenceLabel,
  ReferenceOwner,
  ReferenceRequest,
  WorkspaceSummary,
} from "@/lib/reference-app/types";

/** Stable fictional owners for the ops-workspace Reference App. */
export const REFERENCE_OWNERS: readonly ReferenceOwner[] = [
  { id: "usr_001", name: "Amina Cole", initials: "AC" },
  { id: "usr_002", name: "Jonah Park", initials: "JP" },
  { id: "usr_003", name: "Riley Chen", initials: "RC" },
] as const;

/** Stable fictional labels for later form/filter workflows. */
export const REFERENCE_LABELS: readonly ReferenceLabel[] = [
  { id: "lbl_billing", name: "Billing" },
  { id: "lbl_access", name: "Access" },
  { id: "lbl_infra", name: "Infrastructure" },
  { id: "lbl_ux", name: "UX" },
] as const;

/**
 * Deterministic request records. IDs, dates, and counts must stay stable so
 * Vitest and later RA phases can assert without flakiness.
 * Eighteen rows prove search, filters, sort, pagination (page size 6), and empty state.
 */
export const REFERENCE_REQUESTS: readonly ReferenceRequest[] = [
  {
    id: "req_001",
    title: "Reset SSO session for finance team",
    description: "Finance users report stuck SSO redirects after IdP rotation.",
    status: "open",
    priority: "high",
    ownerId: "usr_001",
    labelIds: ["lbl_access"],
    dueDate: "2026-09-18",
    updatedAt: "2026-09-15T10:00:00.000Z",
  },
  {
    id: "req_002",
    title: "Investigate invoice export timeout",
    description: "CSV export stalls at ~8k rows during month-end close.",
    status: "in_progress",
    priority: "medium",
    ownerId: "usr_002",
    labelIds: ["lbl_billing", "lbl_infra"],
    dueDate: "2026-09-20",
    updatedAt: "2026-09-15T11:30:00.000Z",
  },
  {
    id: "req_003",
    title: "Clarify empty-state copy on Requests",
    description: "Product wants friendlier empty copy when filters yield zero rows.",
    status: "resolved",
    priority: "low",
    ownerId: "usr_003",
    labelIds: ["lbl_ux"],
    dueDate: "2026-09-12",
    updatedAt: "2026-09-14T16:00:00.000Z",
  },
  {
    id: "req_004",
    title: "Archive duplicate onboarding tickets",
    description: "Three legacy tickets duplicate the same provisioning checklist.",
    status: "archived",
    priority: "low",
    ownerId: "usr_001",
    labelIds: ["lbl_access"],
    dueDate: "2026-09-10",
    updatedAt: "2026-09-13T09:15:00.000Z",
  },
  {
    id: "req_005",
    title: "Add capacity alert for batch jobs",
    description: "Ops needs an early warning when overnight jobs exceed queue depth.",
    status: "open",
    priority: "medium",
    ownerId: "usr_002",
    labelIds: ["lbl_infra"],
    dueDate: "2026-09-22",
    updatedAt: "2026-09-15T08:45:00.000Z",
  },
  {
    id: "req_006",
    title: "Rotate staging API keys",
    description: "Quarterly rotation for staging integrations is overdue.",
    status: "open",
    priority: "high",
    ownerId: "usr_003",
    labelIds: ["lbl_infra", "lbl_access"],
    dueDate: "2026-09-16",
    updatedAt: "2026-09-15T07:20:00.000Z",
  },
  {
    id: "req_007",
    title: "Fix truncated tooltip on dense tables",
    description: "Long owner names clip without a hover affordance on narrow widths.",
    status: "in_progress",
    priority: "low",
    ownerId: "usr_003",
    labelIds: ["lbl_ux"],
    dueDate: "2026-09-25",
    updatedAt: "2026-09-14T12:00:00.000Z",
  },
  {
    id: "req_008",
    title: "Reconcile refund ledger mismatch",
    description: "Two refund batches diverge by $42.10 between billing and finance.",
    status: "open",
    priority: "high",
    ownerId: "usr_001",
    labelIds: ["lbl_billing"],
    dueDate: "2026-09-17",
    updatedAt: "2026-09-15T13:05:00.000Z",
  },
  {
    id: "req_009",
    title: "Document webhook retry policy",
    description: "Partners need a public note on backoff and dead-letter handling.",
    status: "resolved",
    priority: "medium",
    ownerId: "usr_002",
    labelIds: ["lbl_infra"],
    dueDate: "2026-09-11",
    updatedAt: "2026-09-12T18:40:00.000Z",
  },
  {
    id: "req_010",
    title: "Provision sandbox for ACME pilot",
    description: "Create isolated tenant with sample catalog for the pilot kickoff.",
    status: "in_progress",
    priority: "medium",
    ownerId: "usr_001",
    labelIds: ["lbl_access"],
    dueDate: "2026-09-19",
    updatedAt: "2026-09-15T09:10:00.000Z",
  },
  {
    id: "req_011",
    title: "Reduce noise in nightly digest email",
    description: "Digest lists archived items that owners already dismissed.",
    status: "open",
    priority: "low",
    ownerId: "usr_002",
    labelIds: ["lbl_ux"],
    dueDate: "2026-09-28",
    updatedAt: "2026-09-14T08:00:00.000Z",
  },
  {
    id: "req_012",
    title: "Investigate slow search on Requests",
    description: "Title search feels laggy above ~5k rows in staging dumps.",
    status: "in_progress",
    priority: "high",
    ownerId: "usr_003",
    labelIds: ["lbl_infra", "lbl_ux"],
    dueDate: "2026-09-21",
    updatedAt: "2026-09-15T14:22:00.000Z",
  },
  {
    id: "req_013",
    title: "Close expired invite tokens",
    description: "Invites older than 30 days should be revoked automatically.",
    status: "resolved",
    priority: "medium",
    ownerId: "usr_001",
    labelIds: ["lbl_access"],
    dueDate: "2026-09-09",
    updatedAt: "2026-09-11T11:00:00.000Z",
  },
  {
    id: "req_014",
    title: "Align badge colors with status legend",
    description: "Resolved currently reads as warning in one legacy panel.",
    status: "archived",
    priority: "low",
    ownerId: "usr_003",
    labelIds: ["lbl_ux"],
    dueDate: "2026-09-08",
    updatedAt: "2026-09-10T15:30:00.000Z",
  },
  {
    id: "req_015",
    title: "Add owner filter to exports",
    description: "CSV export should honor the same owner filter as the table.",
    status: "open",
    priority: "medium",
    ownerId: "usr_002",
    labelIds: ["lbl_billing", "lbl_ux"],
    dueDate: "2026-09-24",
    updatedAt: "2026-09-15T06:55:00.000Z",
  },
  {
    id: "req_016",
    title: "Harden rate limits on public forms",
    description: "Burst traffic from scrapers is filling support queues.",
    status: "in_progress",
    priority: "high",
    ownerId: "usr_001",
    labelIds: ["lbl_infra"],
    dueDate: "2026-09-18",
    updatedAt: "2026-09-15T12:40:00.000Z",
  },
  {
    id: "req_017",
    title: "Migrate legacy priority labels",
    description: "Replace P1/P2 strings with low/medium/high in stored payloads.",
    status: "resolved",
    priority: "low",
    ownerId: "usr_002",
    labelIds: ["lbl_infra"],
    dueDate: "2026-09-13",
    updatedAt: "2026-09-13T17:25:00.000Z",
  },
  {
    id: "req_018",
    title: "Confirm vacation coverage for ops on-call",
    description: "September on-call rotation has two uncovered weekend slots.",
    status: "open",
    priority: "medium",
    ownerId: "usr_003",
    labelIds: ["lbl_access"],
    dueDate: "2026-09-23",
    updatedAt: "2026-09-14T19:05:00.000Z",
  },
] as const;

export function getReferenceRequestById(id: string): ReferenceRequest | undefined {
  return REFERENCE_REQUESTS.find((request) => request.id === id);
}

export function getReferenceOwnerById(id: string): ReferenceOwner | undefined {
  return REFERENCE_OWNERS.find((owner) => owner.id === id);
}

export function getWorkspaceSummary(): WorkspaceSummary {
  const openCount = REFERENCE_REQUESTS.filter((r) => r.status === "open").length;
  const inProgressCount = REFERENCE_REQUESTS.filter((r) => r.status === "in_progress").length;
  const resolvedThisWeek = REFERENCE_REQUESTS.filter((r) => r.status === "resolved").length;

  return {
    openCount,
    inProgressCount,
    resolvedThisWeek,
    totalCount: REFERENCE_REQUESTS.length,
  };
}
