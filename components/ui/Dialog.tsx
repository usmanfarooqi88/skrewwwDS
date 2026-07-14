"use client";

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
  cloneElement,
  isValidElement,
  type ReactNode,
  type RefObject,
} from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import { Portal } from "@/components/ui/internal/Portal";
import { OverlayScopeProvider } from "@/components/ui/internal/OverlayScopeContext";
import { useBackgroundInert } from "@/components/ui/internal/useBackgroundInert";
import { useBodyScrollLock } from "@/components/ui/internal/useBodyScrollLock";
import { useOverlayEscape } from "@/components/ui/internal/useOverlayEscape";
import { useFocusTrap } from "@/components/ui/internal/useFocusTrap";
import { restoreFocusSafely } from "@/components/ui/internal/focus-utils";
import type { OverlayCloseReason } from "@/components/ui/internal/overlay-types";
import styles from "@/components/ui/dialog.module.css";

export type DialogCloseReason = OverlayCloseReason;

type DialogContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  requestClose: (reason: DialogCloseReason) => void;
  titleId: string;
  hasAccessibleTitle: boolean;
  registerAccessibleTitle: (present: boolean) => void;
  descriptionId?: string;
  setDescriptionId: (id: string | undefined) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  closeOnOverlayClick: boolean;
  overlayScopeId: string;
  finalFocusRef: React.MutableRefObject<HTMLElement | null>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(`${component} must be used within Dialog`);
  }
  return context;
}

export type DialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason?: DialogCloseReason) => void;
  closeOnOverlayClick?: boolean;
  children: ReactNode;
};

export function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  closeOnOverlayClick = true,
  children,
}: DialogProps) {
  const titleId = useId();
  const overlayScopeId = useId();
  const [descriptionId, setDescriptionId] = useState<string | undefined>();
  const [accessibleTitleCount, setAccessibleTitleCount] = useState(0);
  const triggerRef = useRef<HTMLElement | null>(null);
  const finalFocusRef = useRef<HTMLElement | null>(null);
  const previousOpenRef = useRef(false);

  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
  });

  const registerAccessibleTitle = useCallback((present: boolean) => {
    setAccessibleTitleCount((count) => Math.max(0, count + (present ? 1 : -1)));
  }, []);

  const requestClose = useCallback(
    (reason: DialogCloseReason) => {
      onOpenChange?.(false, reason);
      setIsOpen(false);
      restoreFocusSafely(finalFocusRef.current, triggerRef.current);
    },
    [onOpenChange, setIsOpen],
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        onOpenChange?.(true);
        setIsOpen(true);
        return;
      }
      requestClose("programmatic");
    },
    [onOpenChange, requestClose, setIsOpen],
  );

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = Boolean(isOpen);
    if (wasOpen && !isOpen) {
      restoreFocusSafely(finalFocusRef.current, triggerRef.current);
    }
  }, [isOpen]);

  const value = useMemo(
    () => ({
      open: Boolean(isOpen),
      setOpen,
      requestClose,
      titleId,
      hasAccessibleTitle: accessibleTitleCount > 0,
      registerAccessibleTitle,
      descriptionId,
      setDescriptionId,
      triggerRef,
      closeOnOverlayClick,
      overlayScopeId,
      finalFocusRef,
    }),
    [
      accessibleTitleCount,
      closeOnOverlayClick,
      descriptionId,
      isOpen,
      overlayScopeId,
      registerAccessibleTitle,
      requestClose,
      setOpen,
      titleId,
    ],
  );

  return (
    <OverlayScopeProvider scopeId={overlayScopeId}>
      <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
    </OverlayScopeProvider>
  );
}

type DialogTriggerProps = {
  children: React.ReactElement<{
    onClick?: React.MouseEventHandler<HTMLElement>;
    ref?: React.Ref<HTMLElement>;
  }>;
};

export function DialogTrigger({ children }: DialogTriggerProps) {
  const { setOpen, triggerRef } = useDialogContext("DialogTrigger");

  if (!isValidElement(children)) return children;

  const child = children as React.ReactElement<{
    onClick?: React.MouseEventHandler<HTMLElement>;
    ref?: React.Ref<HTMLElement>;
  }>;

  return cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = child.props.ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object") {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      child.props.onClick?.(event);
      if (event.defaultPrevented) return;
      setOpen(true);
    },
  });
}

export type DialogContentProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  finalFocusRef?: RefObject<HTMLElement | null>;
};

export function DialogContent({
  children,
  className,
  "aria-label": ariaLabel,
  initialFocusRef,
  finalFocusRef,
}: DialogContentProps) {
  const {
    open,
    requestClose,
    titleId,
    hasAccessibleTitle,
    descriptionId,
    closeOnOverlayClick,
    overlayScopeId,
    finalFocusRef: dialogFinalFocusRef,
  } = useDialogContext("DialogContent");

  const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null);
  const [viewportNode, setViewportNode] = useState<HTMLDivElement | null>(null);
  const warnedMissingTitleRef = useRef(false);

  const setContentRef = useCallback((node: HTMLDivElement | null) => {
    setContentNode(node);
  }, []);

  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    setViewportNode(node);
  }, []);

  useEffect(() => {
    if (open && finalFocusRef?.current) {
      dialogFinalFocusRef.current = finalFocusRef.current;
    }
  }, [dialogFinalFocusRef, finalFocusRef, open]);

  useBodyScrollLock(open);
  useBackgroundInert(open, viewportNode);
  const stackZIndex = useOverlayEscape(open, () => requestClose("escape-key"), { modal: true });
  useFocusTrap(open, contentNode, { initialFocusRef, overlayScopeId });

  useEffect(() => {
    if (!open) {
      warnedMissingTitleRef.current = false;
      return;
    }

    if (
      process.env.NODE_ENV === "development" &&
      !ariaLabel &&
      !hasAccessibleTitle &&
      !warnedMissingTitleRef.current
    ) {
      warnedMissingTitleRef.current = true;
      console.warn(
        "[Skrewww Dialog] Every modal Dialog requires DialogTitle or an explicit aria-label on DialogContent.",
      );
    }
  }, [ariaLabel, hasAccessibleTitle, open]);

  if (!open) return null;

  return (
    <Portal>
      <div
        ref={setViewportRef}
        className={styles.viewport}
        style={{ zIndex: stackZIndex }}
        onMouseDown={(event) => {
          if (!closeOnOverlayClick) return;
          if (event.target === event.currentTarget) {
            requestClose("overlay-pointer");
          }
        }}
      >
        <div
          className={styles.overlayBackdrop}
          aria-hidden="true"
          onMouseDown={() => {
            if (closeOnOverlayClick) requestClose("overlay-pointer");
          }}
        />
        <div
          ref={setContentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabel ? undefined : titleId}
          aria-describedby={descriptionId}
          aria-label={ariaLabel}
          className={cn(styles.content, className)}
          tabIndex={-1}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}

export type DialogTitleProps = {
  children: ReactNode;
  className?: string;
  visuallyHidden?: boolean;
};

export function DialogTitle({ children, className, visuallyHidden = false }: DialogTitleProps) {
  const { titleId, registerAccessibleTitle } = useDialogContext("DialogTitle");

  useEffect(() => {
    registerAccessibleTitle(true);
    return () => registerAccessibleTitle(false);
  }, [registerAccessibleTitle]);

  return (
    <h2 id={titleId} className={cn(styles.title, visuallyHidden && "sr-only", className)}>
      {children}
    </h2>
  );
}

export type DialogDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  const { setDescriptionId } = useDialogContext("DialogDescription");
  const id = useId();

  useEffect(() => {
    setDescriptionId(id);
    return () => setDescriptionId(undefined);
  }, [id, setDescriptionId]);

  return (
    <p id={id} className={cn(styles.description, className)}>
      {children}
    </p>
  );
}

export type DialogCloseProps = {
  className?: string;
  label?: string;
};

export function DialogClose({ className, label = "Close dialog" }: DialogCloseProps) {
  const { requestClose } = useDialogContext("DialogClose");
  return (
    <button
      type="button"
      className={cn(styles.close, className)}
      aria-label={label}
      onClick={() => requestClose("close-button")}
    >
      <X size={16} aria-hidden="true" />
    </button>
  );
}

export type DialogFooterProps = {
  children: ReactNode;
  className?: string;
};

export function DialogFooter({ children, className }: DialogFooterProps) {
  return <div className={cn(styles.footer, className)}>{children}</div>;
}

export type DialogHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return <div className={cn(styles.header, className)}>{children}</div>;
}

export type DialogBodyProps = {
  children: ReactNode;
  className?: string;
};

export function DialogBody({ children, className }: DialogBodyProps) {
  return <div className={cn(styles.body, className)}>{children}</div>;
}
