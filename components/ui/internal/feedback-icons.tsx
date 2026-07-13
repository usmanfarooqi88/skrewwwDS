import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { FeedbackStatus } from "@/components/ui/internal/feedback-types";

export function FeedbackIcon({
  status,
  className,
}: {
  status: FeedbackStatus;
  className?: string;
}) {
  const props = {
    size: 20,
    weight: "fill" as const,
    className,
    "aria-hidden": true as const,
  };

  if (status === "error") return <WarningCircle {...props} />;
  if (status === "warning") return <Warning {...props} />;
  if (status === "success") return <CheckCircle {...props} />;
  return <Info {...props} />;
}
