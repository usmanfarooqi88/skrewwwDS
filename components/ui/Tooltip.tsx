"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { computeTooltipPosition } from "@/components/ui/internal/tooltip-position";
import type { TooltipPlacement } from "@/components/ui/internal/tooltip-position";
import { mergeRefs } from "@/components/ui/internal/assign-ref";
import { useIsClient } from "@/components/ui/internal/useIsClient";
import { useTooltipController } from "@/components/ui/internal/useTooltipController";
import { useOverlayEscape } from "@/components/ui/internal/useOverlayEscape";
import styles from "@/components/ui/tooltip.module.css";

type TooltipTriggerProps = {
  "aria-describedby"?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  ref?: React.Ref<HTMLElement>;
};

type TooltipTriggerBindProps = {
  child: React.ReactElement<TooltipTriggerProps>;
  triggerRef: React.RefObject<HTMLElement | null>;
  describedBy?: string;
  scheduleOpen: () => void;
  scheduleClose: () => void;
  openImmediately: () => void;
};

function TooltipTriggerBind({
  child,
  triggerRef,
  describedBy,
  scheduleOpen,
  scheduleClose,
  openImmediately,
}: TooltipTriggerBindProps) {
  return cloneElement(child, {
    ref: mergeRefs(triggerRef, child.props.ref),
    "aria-describedby": describedBy || undefined,
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      child.props.onMouseEnter?.(event);
      scheduleOpen();
    },
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
      child.props.onMouseLeave?.(event);
      scheduleClose();
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      child.props.onFocus?.(event);
      openImmediately();
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      child.props.onBlur?.(event);
      scheduleClose();
    },
  });
}

export type TooltipProps = {
  content: React.ReactNode;
  placement?: TooltipPlacement;
  openDelay?: number;
  closeDelay?: number;
  disabled?: boolean;
  className?: string;
  children: React.ReactElement<TooltipTriggerProps>;
};

export function Tooltip({
  content,
  placement = "top",
  openDelay,
  closeDelay,
  disabled = false,
  className,
  children,
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const mounted = useIsClient();
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [resolvedPlacement, setResolvedPlacement] = useState(placement);
  const {
    open,
    scheduleOpen,
    scheduleClose,
    openImmediately,
    closeImmediately,
  } = useTooltipController({ openDelay, closeDelay, disabled });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const next = computeTooltipPosition(
      triggerRect,
      tooltipRect,
      placement,
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tooltip-offset")) ||
        8,
    );
    setCoords({ top: next.top, left: next.left });
    setResolvedPlacement(next.placement);
  }, [open, placement, content]);

  const stackZIndex = useOverlayEscape(open, closeImmediately);

  if (!isValidElement(children)) {
    return children;
  }

  const child = children as React.ReactElement<TooltipTriggerProps>;

  const describedBy =
    open && content
      ? [child.props["aria-describedby"], tooltipId].filter(Boolean).join(" ")
      : child.props["aria-describedby"];

  const trigger = (
    <TooltipTriggerBind
      child={child}
      triggerRef={triggerRef}
      describedBy={describedBy}
      scheduleOpen={scheduleOpen}
      scheduleClose={scheduleClose}
      openImmediately={openImmediately}
    />
  );

  const tooltipNode =
    open && mounted && content ? (
      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        className={cn(styles.tooltip, styles[resolvedPlacement], className)}
        style={{ top: coords.top, left: coords.left, zIndex: stackZIndex }}
        onMouseEnter={openImmediately}
        onMouseLeave={scheduleClose}
      >
        {content}
      </div>
    ) : null;

  return (
    <>
      {trigger}
      {mounted && tooltipNode ? createPortal(tooltipNode, document.body) : null}
    </>
  );
}
