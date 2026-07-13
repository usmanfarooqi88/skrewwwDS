import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { FeedbackIcon } from "@/components/ui/internal/feedback-icons";
import type {
  FeedbackAnnounce,
  FeedbackStatus,
} from "@/components/ui/internal/feedback-types";
import { resolveFeedbackLiveRegion } from "@/components/ui/internal/feedback-types";
import styles from "@/components/ui/internal/feedback-surface.module.css";

export type FeedbackSurfaceProps = {
  status: FeedbackStatus;
  title?: string;
  description?: ReactNode;
  announce?: FeedbackAnnounce;
  dismissible?: boolean;
  dismissLabel?: string;
  onDismiss?: () => void;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function FeedbackSurface({
  status,
  title,
  description,
  announce = "off",
  dismissible = false,
  dismissLabel = "Dismiss",
  onDismiss,
  action,
  className,
  children,
}: FeedbackSurfaceProps) {
  const liveRegion = resolveFeedbackLiveRegion(announce, status);

  return (
    <div
      className={cn(styles.feedback, styles[status], className)}
      role={liveRegion.role}
      aria-live={liveRegion.ariaLive}
    >
      <FeedbackIcon status={status} className={styles.icon} />
      <div className={styles.content}>
        {title ? <p className={styles.title}>{title}</p> : null}
        {description ? <p className={styles.description}>{description}</p> : null}
        {children}
        {action ? <div className={styles.actions}>{action}</div> : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          className={styles.dismiss}
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <X size={16} weight="bold" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
