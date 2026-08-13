"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { FeedbackSurface } from "@/components/ui/internal/FeedbackSurface";
import type {
  FeedbackAnnounce,
  FeedbackStatus,
} from "@/components/ui/internal/feedback-types";
import styles from "@/components/ui/toast.module.css";

export type ToastInput = {
  id?: string;
  type?: FeedbackStatus;
  title?: string;
  description: ReactNode;
  duration?: number;
  announce?: FeedbackAnnounce;
  dismissLabel?: string;
};

type ToastRecord = ToastInput & { id: string };

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
  return `toast-${Math.random().toString(36).slice(2, 9)}`;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const duration = toast.duration ?? 5000;
  const announce = toast.announce ?? (toast.type === "error" ? "assertive" : "polite");

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearTimer();
    if (duration <= 0 || paused || hidden) {
      return;
    }
    timeoutRef.current = window.setTimeout(() => onDismiss(toast.id), duration);
  }, [clearTimer, duration, hidden, onDismiss, paused, toast.id]);

  useEffect(() => {
    scheduleDismiss();
    return clearTimer;
  }, [clearTimer, scheduleDismiss]);

  useEffect(() => {
    setHidden(document.visibilityState === "hidden");
    function onVisibilityChange() {
      setHidden(document.visibilityState === "hidden");
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss(toast.id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss, toast.id]);

  return (
    <div
      className={cn(styles.toast)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <FeedbackSurface
        surface="toast"
        status={toast.type ?? "info"}
        title={toast.title}
        description={toast.description}
        announce={announce}
        dismissible
        dismissLabel={toast.dismissLabel ?? "Dismiss notification"}
        onDismiss={() => onDismiss(toast.id)}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = input.id ?? createToastId();
    setToasts((current) => [...current, { ...input, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-relevant="additions">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
