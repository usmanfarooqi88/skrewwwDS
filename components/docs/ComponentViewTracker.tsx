"use client";

import { useTrackComponentViewed } from "@/lib/analytics";

/** Renders nothing — fires `component_viewed` once per distinct slug. */
export function ComponentViewTracker({
  slug,
  name,
  category,
}: {
  slug: string;
  name: string;
  category: string;
}) {
  useTrackComponentViewed(slug, name, category);
  return null;
}
