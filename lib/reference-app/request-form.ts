import type {
  ReferenceRequest,
  RequestPriority,
  RequestStatus,
} from "@/lib/reference-app/types";

export type RequestFormValues = {
  title: string;
  description: string;
  status: RequestStatus;
  ownerId: string;
  dueDate: string;
  labelIds: string[];
  priority: RequestPriority;
  notifyWatchers: boolean;
};

export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>;

export const EMPTY_REQUEST_FORM_VALUES: RequestFormValues = {
  title: "",
  description: "",
  status: "open",
  ownerId: "",
  dueDate: "",
  labelIds: [],
  priority: "medium",
  notifyWatchers: false,
};

export function createNewRequestFormValues(): RequestFormValues {
  return { ...EMPTY_REQUEST_FORM_VALUES, labelIds: [] };
}

export function requestToFormValues(request: ReferenceRequest): RequestFormValues {
  return {
    title: request.title,
    description: request.description,
    status: request.status,
    ownerId: request.ownerId,
    dueDate: request.dueDate,
    labelIds: [...request.labelIds],
    priority: request.priority,
    notifyWatchers: false,
  };
}

export function normalizeRequestFormValues(values: RequestFormValues): RequestFormValues {
  return {
    ...values,
    title: values.title.trim(),
    description: values.description.trim(),
    ownerId: values.ownerId.trim(),
    dueDate: values.dueDate.trim(),
    labelIds: [...values.labelIds].sort(),
  };
}

export function areRequestFormValuesEqual(
  left: RequestFormValues,
  right: RequestFormValues,
): boolean {
  const a = normalizeRequestFormValues(left);
  const b = normalizeRequestFormValues(right);
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.status === b.status &&
    a.ownerId === b.ownerId &&
    a.dueDate === b.dueDate &&
    a.priority === b.priority &&
    a.notifyWatchers === b.notifyWatchers &&
    a.labelIds.join("|") === b.labelIds.join("|")
  );
}

export function isRequestFormDirty(
  current: RequestFormValues,
  initial: RequestFormValues,
): boolean {
  return !areRequestFormValuesEqual(current, initial);
}

export function validateRequestForm(values: RequestFormValues): RequestFormErrors {
  const errors: RequestFormErrors = {};
  if (!values.title.trim()) {
    errors.title = "Enter a request title.";
  }
  if (!values.ownerId.trim()) {
    errors.ownerId = "Choose an owner.";
  }
  return errors;
}

export function toggleRequestLabel(labelIds: string[], labelId: string): string[] {
  if (labelIds.includes(labelId)) {
    return labelIds.filter((id) => id !== labelId);
  }
  return [...labelIds, labelId];
}
