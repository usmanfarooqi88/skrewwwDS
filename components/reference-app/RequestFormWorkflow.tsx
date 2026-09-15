"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RequestForm } from "@/components/reference-app/RequestForm";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/Menu";
import { useToast } from "@/components/ui/ToastProvider";
import {
  createNewRequestFormValues,
  isRequestFormDirty,
  requestToFormValues,
  validateRequestForm,
  type RequestFormErrors,
  type RequestFormValues,
} from "@/lib/reference-app/request-form";
import type { ReferenceRequest } from "@/lib/reference-app/types";

type RequestFormWorkflowProps =
  | {
      mode: "new";
      request?: undefined;
    }
  | {
      mode: "edit";
      request: ReferenceRequest;
    };

/**
 * Application-scoped New/Edit workflow. Values are not persisted across refresh —
 * submit shows toast feedback and navigates to the Requests list.
 */
export function RequestFormWorkflow(props: RequestFormWorkflowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const requestKey = props.mode === "edit" ? props.request.id : "new";
  const initial = useMemo(
    () =>
      props.mode === "edit"
        ? requestToFormValues(props.request)
        : createNewRequestFormValues(),
    // requestKey captures fixture identity; full request object is stable per route.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
    [requestKey],
  );
  const [values, setValues] = useState<RequestFormValues>(initial);
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const dirty = isRequestFormDirty(values, initial);

  function handleChange(next: RequestFormValues) {
    setValues(next);
    setErrors((current) => {
      if (!current.title && !current.ownerId) return current;
      const nextErrors = { ...current };
      if (next.title.trim()) delete nextErrors.title;
      if (next.ownerId.trim()) delete nextErrors.ownerId;
      return nextErrors;
    });
  }

  function handleSubmit() {
    const nextErrors = validateRequestForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({
        type: "error",
        description: "Fix the highlighted fields before saving.",
      });
      return;
    }

    toast({
      type: "success",
      description:
        props.mode === "new"
          ? "Request validated. Not persisted across refresh in the Reference App."
          : `${props.request.id} updated in this session. Not persisted across refresh.`,
    });
    router.push("/reference/data");
  }

  function requestCancel() {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    router.push("/reference/data");
  }

  function discardChanges() {
    setDiscardOpen(false);
    router.push("/reference/data");
  }

  return (
    <div className="space-y-8 px-4 py-6 md:px-8">
      <RequestForm
        values={values}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={requestCancel}
        submitLabel={props.mode === "new" ? "Create request" : "Save changes"}
        cancelRef={cancelRef}
      />

      {/*
        Bottom-of-page Menu for overlay collision audit. Prefers placement=bottom;
        shared popover-position engine should flip/clamp inside the viewport.
      */}
      <div
        className="mx-auto flex max-w-2xl justify-end border-t border-ink-200 pt-6"
        data-testid="request-form-collision-zone"
      >
        <Menu placement="bottom" align="end">
          <MenuTrigger>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label="More request actions"
              data-testid="request-form-bottom-menu"
            >
              More actions
            </Button>
          </MenuTrigger>
          <MenuContent aria-label="More request actions">
            <MenuItem disabled>Duplicate (later)</MenuItem>
            <MenuItem disabled>Archive (later)</MenuItem>
          </MenuContent>
        </Menu>
      </div>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent finalFocusRef={cancelRef}>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <DialogDescription>
            Your edits will be lost. This Reference App does not persist form drafts.
          </DialogDescription>
          <DialogBody>
            <p className="text-sm text-ink-700">
              Continue editing to keep your changes, or discard to return to Requests.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDiscardOpen(false)}>
              Continue editing
            </Button>
            <Button type="button" variant="danger" onClick={discardChanges}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
