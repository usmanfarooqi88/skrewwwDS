import { useCallback, useEffect, useRef, useState } from "react";

type UseTooltipControllerOptions = {
  openDelay?: number;
  closeDelay?: number;
  disabled?: boolean;
};

export function useTooltipController({
  openDelay = 300,
  closeDelay = 100,
  disabled = false,
}: UseTooltipControllerOptions = {}) {
  const [open, setOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const scheduleOpen = useCallback(() => {
    if (disabled) return;
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), openDelay);
  }, [clearTimers, disabled, openDelay]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [clearTimers, closeDelay]);

  const openImmediately = useCallback(() => {
    if (disabled) return;
    clearTimers();
    setOpen(true);
  }, [clearTimers, disabled]);

  const closeImmediately = useCallback(() => {
    clearTimers();
    setOpen(false);
  }, [clearTimers]);

  return {
    open,
    scheduleOpen,
    scheduleClose,
    openImmediately,
    closeImmediately,
  };
}
