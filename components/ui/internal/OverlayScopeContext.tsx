"use client";

import { createContext, useContext } from "react";

const OverlayScopeContext = createContext<string | undefined>(undefined);

export function OverlayScopeProvider({
  scopeId,
  children,
}: {
  scopeId: string;
  children: React.ReactNode;
}) {
  return <OverlayScopeContext.Provider value={scopeId}>{children}</OverlayScopeContext.Provider>;
}

export function useOverlayScope(): string | undefined {
  return useContext(OverlayScopeContext);
}
