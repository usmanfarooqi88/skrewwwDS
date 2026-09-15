export type RequestStatus = "open" | "in_progress" | "resolved" | "archived";

export type RequestPriority = "low" | "medium" | "high";

export type ReferenceOwner = {
  id: string;
  name: string;
  initials: string;
};

export type ReferenceLabel = {
  id: string;
  name: string;
};

export type ReferenceRequest = {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  priority: RequestPriority;
  ownerId: string;
  labelIds: string[];
  dueDate: string;
  updatedAt: string;
};

export type WorkspaceSummary = {
  openCount: number;
  inProgressCount: number;
  resolvedThisWeek: number;
  totalCount: number;
};

export type ReferenceNavItem = {
  href: string;
  label: string;
  match: "exact" | "prefix";
};
