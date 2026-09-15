"use client";

import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { REFERENCE_OWNERS } from "@/lib/reference-app/fixtures";
import type { RequestFilters } from "@/lib/reference-app/query-requests";

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Any priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const OWNER_OPTIONS = [
  { value: "", label: "Any owner" },
  ...REFERENCE_OWNERS.map((owner) => ({ value: owner.id, label: owner.name })),
];

type RequestFiltersFormProps = {
  value: RequestFilters;
  onChange: (next: RequestFilters) => void;
};

/** Shared filter controls for desktop Popover and mobile Drawer. */
export function RequestFiltersForm({ value, onChange }: RequestFiltersFormProps) {
  return (
    <div className="grid gap-4">
      <Select
        label="Status"
        size="sm"
        options={STATUS_OPTIONS}
        value={value.status}
        onChange={(event) =>
          onChange({
            ...value,
            status: event.target.value as RequestFilters["status"],
          })
        }
      />
      <Combobox
        label="Owner"
        size="sm"
        options={OWNER_OPTIONS}
        value={value.ownerId}
        onValueChange={(ownerId) => onChange({ ...value, ownerId })}
        placeholder="Any owner"
      />
      <Select
        label="Priority"
        size="sm"
        options={PRIORITY_OPTIONS}
        value={value.priority}
        onChange={(event) =>
          onChange({
            ...value,
            priority: event.target.value as RequestFilters["priority"],
          })
        }
      />
      <DatePicker
        label="Due on or before"
        value={value.dueOnOrBefore || undefined}
        onValueChange={(dueOnOrBefore) =>
          onChange({ ...value, dueOnOrBefore: dueOnOrBefore ?? "" })
        }
        supportingText="Leave empty to ignore due date."
      />
    </div>
  );
}
