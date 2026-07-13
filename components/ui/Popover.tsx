"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import { Portal } from "@/components/ui/internal/Portal";
import { useOverlayScope } from "@/components/ui/internal/OverlayScopeContext";
import { useOverlayEscape } from "@/components/ui/internal/useOverlayEscape";
import { useOutsidePointer } from "@/components/ui/internal/useOutsidePointer";
import {
  computePopoverPosition,
  type PopoverAlign,
  type PopoverPlacement,
} from "@/components/ui/internal/popover-position";
import { resolveInitialFocusTarget, restoreFocusSafely } from "@/components/ui/internal/focus-utils";
import { useFloatingPosition } from "@/components/ui/internal/useFloatingPosition";
import styles from "@/components/ui/popover.module.css";

export type PopoverFocusMode = "trigger" | "content";

type PopoverContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  requestClose: (options?: { restoreFocus?: boolean }) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentId: string;
  titleId: string;
  hasAccessibleName: boolean;
  registerAccessibleName: (present: boolean) => void;
  placement: PopoverPlacement;
  align: PopoverAlign;
  focusMode: PopoverFocusMode;
  showArrow: boolean;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error(`${component} must be used within Popover`);
  }
  return context;
}

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Override the popover content element id (used for aria-controls wiring). */
  contentId?: string;
  placement?: PopoverPlacement;
  align?: PopoverAlign;
  focusMode?: PopoverFocusMode;
  showArrow?: boolean;
  children: ReactNode;
};

export function Popover({
  open,
  defaultOpen = false,
  onOpenChange,
  contentId: contentIdProp,
  placement = "bottom",
  align = "center",
  focusMode = "trigger",
  showArrow = true,
  children,
}: PopoverProps) {
  const generatedContentId = useId();
  const contentId = contentIdProp ?? generatedContentId;
  const titleId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [accessibleNameCount, setAccessibleNameCount] = useState(0);
  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const requestClose = useCallback(
    (options?: { restoreFocus?: boolean }) => {
      setIsOpen(false);
      if (options?.restoreFocus) {
        restoreFocusSafely(triggerRef.current);
      }
    },
    [setIsOpen],
  );

  const setOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next);
    },
    [setIsOpen],
  );

  const registerAccessibleName = useCallback((present: boolean) => {
    setAccessibleNameCount((count) => Math.max(0, count + (present ? 1 : -1)));
  }, []);

  const value = useMemo(
    () => ({
      open: Boolean(isOpen),
      setOpen,
      requestClose,
      triggerRef,
      contentId,
      titleId,
      hasAccessibleName: accessibleNameCount > 0,
      registerAccessibleName,
      placement,
      align,
      focusMode,
      showArrow,
    }),
    [
      accessibleNameCount,
      align,
      contentId,
      focusMode,
      isOpen,
      placement,
      registerAccessibleName,
      requestClose,
      setOpen,
      showArrow,
      titleId,
    ],
  );

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

type PopoverTriggerProps = {
  children: React.ReactElement<{
    onClick?: React.MouseEventHandler<HTMLElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
    ref?: React.Ref<HTMLElement>;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
  }>;
};

/** Registers a positioning anchor without toggle behavior — used by Combobox inputs. */
export function PopoverAnchor({
  children,
}: {
  children: React.ReactElement<{ ref?: React.Ref<HTMLElement> }>;
}) {
  const { triggerRef } = usePopoverContext("PopoverAnchor");

  if (!isValidElement(children)) return children;

  const child = children;

  return cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (child as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object") {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
  });
}

export function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { open, setOpen, requestClose, triggerRef, contentId } =
    usePopoverContext("PopoverTrigger");

  if (!isValidElement(children)) return children;

  const child = children;

  return cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (child as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object") {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    "aria-expanded": open,
    "aria-controls":
      child.props["aria-controls"] ?? (open ? contentId : undefined),
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      child.props.onClick?.(event);
      if (event.defaultPrevented) return;
      if (open) requestClose({ restoreFocus: true });
      else setOpen(true);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      child.props.onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (open) requestClose({ restoreFocus: true });
        else setOpen(true);
      }
    },
  });
}

export type PopoverContentProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  "aria-label"?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Pin popover width to the trigger before positioning — used by Select listboxes. */
  matchTriggerWidth?: boolean;
};

export function PopoverContent({
  children,
  className,
  style,
  id: idProp,
  "aria-label": ariaLabel,
  initialFocusRef,
  matchTriggerWidth = false,
}: PopoverContentProps) {
  const {
    open,
    requestClose,
    triggerRef,
    contentId,
    titleId,
    hasAccessibleName: hasTitleRegistered,
    placement,
    align,
    focusMode,
    showArrow,
  } = usePopoverContext("PopoverContent");

  const overlayScopeId = useOverlayScope();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [resolvedPlacement, setResolvedPlacement] = useState(placement);

  const setContentRef = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
    setContentNode(node);
  }, []);

  useOverlayEscape(open, () => requestClose({ restoreFocus: true }), { modal: false });
  useOutsidePointer({
    active: open,
    onOutsidePointer: () => requestClose({ restoreFocus: false }),
    getInsideElements: () => [triggerRef.current, contentNode],
  });

  const applyTriggerWidth = useCallback(() => {
    if (!matchTriggerWidth || !triggerRef.current || !contentRef.current) return undefined;

    const viewportPadding =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--popover-viewport-padding",
        ),
      ) || 8;
    const maxWidth = window.innerWidth - viewportPadding * 2;
    const triggerWidth = Math.min(triggerRef.current.getBoundingClientRect().width, maxWidth);
    contentRef.current.style.width = `${triggerWidth}px`;
    contentRef.current.style.minWidth = `${triggerWidth}px`;
    contentRef.current.style.maxWidth = `${triggerWidth}px`;
    contentRef.current.style.boxSizing = "border-box";
    return triggerWidth;
  }, [matchTriggerWidth, triggerRef]);

  const updatePosition = useCallback(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const measuredRect = contentRef.current.getBoundingClientRect();
    const viewportPadding =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--popover-viewport-padding",
        ),
      ) || 8;
    const maxWidth = window.innerWidth - viewportPadding * 2;
    const triggerWidth = matchTriggerWidth
      ? Math.min(triggerRect.width, maxWidth)
      : measuredRect.width;
    const popoverRect = new DOMRect(
      measuredRect.x,
      measuredRect.y,
      triggerWidth,
      measuredRect.height || contentRef.current.offsetHeight,
    );
    const offset =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--popover-offset"),
      ) || 8;

    const next = computePopoverPosition(
      triggerRect,
      popoverRect,
      placement,
      align,
      offset,
      viewportPadding,
    );
    setCoords({ top: next.top, left: next.left });
    setResolvedPlacement(next.placement);
  }, [align, matchTriggerWidth, open, placement, triggerRef]);

  useFloatingPosition({
    enabled: open,
    triggerElement: triggerRef.current,
    floatingElement: contentNode,
    onUpdate: updatePosition,
  });

  useLayoutEffect(() => {
    if (!open || !contentNode) return;
    applyTriggerWidth();
    updatePosition();
  }, [applyTriggerWidth, contentNode, open, updatePosition, children, style]);

  useLayoutEffect(() => {
    if (!open || !contentNode || focusMode !== "content") return;

    const focusInitial = () => {
      const target = resolveInitialFocusTarget(contentNode, initialFocusRef);
      target.focus();
    };

    focusInitial();
    const timer = window.setTimeout(focusInitial, 0);
    return () => window.clearTimeout(timer);
  }, [contentNode, focusMode, initialFocusRef, open]);

  if (!open) return null;

  const hasAccessibleName = Boolean(ariaLabel) || hasTitleRegistered;
  const role = hasAccessibleName ? "dialog" : undefined;
  const labelledBy = ariaLabel ? undefined : hasTitleRegistered ? titleId : undefined;

  return (
    <Portal>
      <div
        ref={setContentRef}
        id={idProp ?? contentId}
        role={role}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        data-skrewww-overlay-scope={overlayScopeId}
        data-skrewww-popover-interactive={focusMode === "content" ? "true" : undefined}
        data-skrewww-popover-fit={matchTriggerWidth ? "trigger" : undefined}
        className={cn(styles.popover, styles[resolvedPlacement], className)}
        style={{ top: coords.top, left: coords.left, ...style }}
        tabIndex={focusMode === "content" && !hasAccessibleName ? -1 : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {showArrow ? <span className={styles.arrow} aria-hidden="true" /> : null}
        {children}
      </div>
    </Portal>
  );
}

export type PopoverTitleProps = {
  children: ReactNode;
  className?: string;
  visuallyHidden?: boolean;
};

export function PopoverTitle({
  children,
  className,
  visuallyHidden = false,
}: PopoverTitleProps) {
  const { titleId, registerAccessibleName } = usePopoverContext("PopoverTitle");

  useEffect(() => {
    registerAccessibleName(true);
    return () => registerAccessibleName(false);
  }, [registerAccessibleName]);

  return (
    <h3 id={titleId} className={cn(styles.title, visuallyHidden && "sr-only", className)}>
      {children}
    </h3>
  );
}

export type PopoverDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export function PopoverDescription({ children, className }: PopoverDescriptionProps) {
  return <p className={cn(styles.description, className)}>{children}</p>;
}

export type PopoverCloseProps = {
  className?: string;
  label?: string;
};

export function PopoverClose({ className, label = "Close popover" }: PopoverCloseProps) {
  const { requestClose } = usePopoverContext("PopoverClose");
  return (
    <button
      type="button"
      className={cn(styles.close, className)}
      aria-label={label}
      onClick={() => {
        requestClose({ restoreFocus: true });
      }}
    >
      <X size={14} aria-hidden="true" />
    </button>
  );
}

export type PopoverBodyProps = {
  children: ReactNode;
  className?: string;
};

export function PopoverBody({ children, className }: PopoverBodyProps) {
  return <div className={cn(styles.body, className)}>{children}</div>;
}

/** Close the nearest Popover from composed overlay content such as Select listboxes. */
export function usePopoverRequestClose() {
  const { requestClose } = usePopoverContext("usePopoverRequestClose");
  return requestClose;
}

/** Read open state from the nearest Popover — useful for measuring on open. */
export function usePopoverOpen() {
  return usePopoverContext("usePopoverOpen").open;
}

/** Open or close the nearest Popover from composed content such as Select triggers. */
export function usePopoverSetOpen() {
  return usePopoverContext("usePopoverSetOpen").setOpen;
}
