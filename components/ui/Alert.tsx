"use client";

import { useState } from "react";
import { FeedbackSurface } from "@/components/ui/internal/FeedbackSurface";
import type {
  FeedbackAnnounce,
  FeedbackStatus,
} from "@/components/ui/internal/feedback-types";

export type AlertProps = {
  type?: FeedbackStatus;
  title?: string;
  description?: React.ReactNode;
  announce?: FeedbackAnnounce;
  dismissible?: boolean;
  dismissLabel?: string;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
};

export function Alert({
  type = "info",
  title,
  description,
  announce = "off",
  dismissible = false,
  dismissLabel = "Dismiss alert",
  onDismiss,
  action,
  className,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  function handleDismiss() {
    setVisible(false);
    onDismiss?.();
  }

  return (
    <FeedbackSurface
      status={type}
      title={title}
      description={description}
      announce={announce}
      dismissible={dismissible}
      dismissLabel={dismissLabel}
      onDismiss={handleDismiss}
      action={action}
      className={className}
    />
  );
}
