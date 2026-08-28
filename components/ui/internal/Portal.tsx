"use client";

import { createPortal } from "react-dom";
import { useIsClient } from "@/components/ui/internal/useIsClient";

export type PortalProps = {
  children: React.ReactNode;
  container?: Element | DocumentFragment | null;
};

export function Portal({ children, container }: PortalProps) {
  const mounted = useIsClient();

  if (!mounted) return null;

  const target =
    container ?? (typeof document !== "undefined" ? document.body : null);
  if (!target) return null;

  return createPortal(children, target);
}
