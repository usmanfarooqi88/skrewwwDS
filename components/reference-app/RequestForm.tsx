"use client";

import { Info } from "@phosphor-icons/react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { TextInput } from "@/components/ui/TextInput";
import { Textarea } from "@/components/ui/Textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { Tooltip } from "@/components/ui/Tooltip";
import { REFERENCE_LABELS, REFERENCE_OWNERS } from "@/lib/reference-app/fixtures";
import type {
  RequestFormErrors,
  RequestFormValues,
} from "@/lib/reference-app/request-form";
import { toggleRequestLabel } from "@/lib/reference-app/request-form";
import type { RequestPriority, RequestStatus } from "@/lib/reference-app/types";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

const OWNER_OPTIONS = REFERENCE_OWNERS.map((owner) => ({
  value: owner.id,
  label: owner.name,
}));

type RequestFormProps = {
  values: RequestFormValues;
  errors: RequestFormErrors;
  onChange: (next: RequestFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  formId?: string;
  cancelRef?: RefObject<HTMLButtonElement | null>;
};

export function RequestForm({
  values,
  errors,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  formId = "reference-request-form",
  cancelRef,
}: RequestFormProps) {
  return (
    <form
      id={formId}
      className="mx-auto max-w-2xl space-y-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <TextInput
        label="Title"
        required
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        error={errors.title}
        supportingText="Short summary shown in the Requests table."
      />

      <Textarea
        label="Description"
        value={values.description}
        onChange={(event) => onChange({ ...values, description: event.target.value })}
        error={errors.description}
        rows={5}
        supportingText="Context for the assignee."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(event) =>
            onChange({
              ...values,
              status: event.target.value as RequestStatus,
            })
          }
          error={errors.status}
        />
        <Combobox
          label="Owner"
          required
          options={OWNER_OPTIONS}
          value={values.ownerId}
          onValueChange={(ownerId) => onChange({ ...values, ownerId })}
          placeholder="Choose an owner"
          error={errors.ownerId}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <DatePicker
          label="Due date"
          value={values.dueDate || undefined}
          onValueChange={(dueDate) => onChange({ ...values, dueDate: dueDate ?? "" })}
          error={errors.dueDate}
          supportingText="Optional."
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-900" id={`${formId}-priority-label`}>
            Priority
          </p>
          <ToggleGroup
            aria-labelledby={`${formId}-priority-label`}
            value={values.priority}
            onValueChange={(priority) =>
              onChange({ ...values, priority: priority as RequestPriority })
            }
            size="sm"
          >
            <ToggleGroupItem value="low">Low</ToggleGroupItem>
            <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
            <ToggleGroupItem value="high">High</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-ink-900">Labels</legend>
        <p className="text-sm text-ink-600">
          Multi-select via checkboxes (composition). No Multi Select component.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {REFERENCE_LABELS.map((label) => (
            <Checkbox
              key={label.id}
              label={label.name}
              checked={values.labelIds.includes(label.id)}
              onChange={() =>
                onChange({
                  ...values,
                  labelIds: toggleRequestLabel(values.labelIds, label.id),
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Switch
            label="Notify watchers"
            checked={values.notifyWatchers}
            onCheckedChange={(notifyWatchers) => onChange({ ...values, notifyWatchers })}
          />
        </div>
        <Tooltip content="Sends an in-app notice to watchers. Not persisted in RA-3 fixtures.">
          <button
            type="button"
            className="mt-1 inline-flex rounded-md p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
            aria-label="About notify watchers"
          >
            <Info size={16} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-ink-200 pt-4">
        <Button type="submit">{submitLabel}</Button>
        <Button ref={cancelRef} type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
