import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/validation-message.module.css";

export type ValidationMessageType = "error" | "warning" | "success" | "info";

export type ValidationAnnounce = "off" | "polite" | "assertive";

const typeClass: Record<ValidationMessageType, string> = {
  error: styles.error,
  warning: styles.warning,
  success: styles.success,
  info: styles.info,
};

const iconClass: Record<ValidationMessageType, string> = {
  error: styles.iconError,
  warning: styles.iconWarning,
  success: styles.iconSuccess,
  info: styles.iconInfo,
};

function ValidationIcon({ type }: { type: ValidationMessageType }) {
  const props = {
    size: 16,
    weight: "fill" as const,
    className: cn(styles.icon, iconClass[type]),
    "aria-hidden": true,
  };

  if (type === "error") return <WarningCircle {...props} />;
  if (type === "warning") return <Warning {...props} />;
  if (type === "success") return <CheckCircle {...props} />;
  return <Info {...props} />;
}

function resolveRole(type: ValidationMessageType, announce: ValidationAnnounce) {
  if (announce === "off") return undefined;
  if (announce === "assertive" && type === "error") return "alert";
  return "status";
}

export function ValidationMessage({
  id,
  type = "error",
  announce = "off",
  children,
  className,
}: {
  id?: string;
  type?: ValidationMessageType;
  announce?: ValidationAnnounce;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      id={id}
      className={cn(styles.message, typeClass[type], className)}
      role={resolveRole(type, announce)}
    >
      <ValidationIcon type={type} />
      <span>{children}</span>
    </p>
  );
}
