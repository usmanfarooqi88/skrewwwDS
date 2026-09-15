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
