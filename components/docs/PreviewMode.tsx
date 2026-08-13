"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export const previewSurfaceModes = ["flat", "gradient", "glass"] as const;
export const previewShapeModes = ["sharp", "rounded", "pill", "squircle"] as const;

export type PreviewSurfaceMode = (typeof previewSurfaceModes)[number];
export type PreviewShapeMode = (typeof previewShapeModes)[number];

type PreviewModeValue = {
  surface: PreviewSurfaceMode;
  shape: PreviewShapeMode;
  setSurface: (surface: PreviewSurfaceMode) => void;
  setShape: (shape: PreviewShapeMode) => void;
};

const PreviewModeContext = createContext<PreviewModeValue | null>(null);

export function PreviewModeProvider({ children }: { children: ReactNode }) {
  const [surface, setSurface] = useState<PreviewSurfaceMode>("flat");
  const [shape, setShape] = useState<PreviewShapeMode>("rounded");
  const value = useMemo(
    () => ({ surface, shape, setSurface, setShape }),
    [surface, shape],
  );

  return <PreviewModeContext.Provider value={value}>{children}</PreviewModeContext.Provider>;
}

export function usePreviewMode() {
  const value = useContext(PreviewModeContext);
  if (!value) {
    throw new Error("usePreviewMode must be used within PreviewModeProvider");
  }
  return value;
}

export function PreviewSandbox({ children }: { children: ReactNode }) {
  const value = useContext(PreviewModeContext);

  if (!value) return children;

  return (
    <div
      data-skrewww-preview-sandbox=""
      data-skrewww-surface={value.surface}
      data-skrewww-shape={value.shape}
    >
      {children}
    </div>
  );
}
