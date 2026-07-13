"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

export type PortalProps = {
  children: React.ReactNode;
  container?: Element | DocumentFragment | null;
};

export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target =
    container ?? (typeof document !== "undefined" ? document.body : null);
  if (!target) return null;

  return createPortal(children, target);
}
