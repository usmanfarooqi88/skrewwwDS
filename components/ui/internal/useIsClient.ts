import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Client-only gate for portals and browser APIs.
 * Hydration uses the server snapshot (`false`); the client snapshot is `true`.
 */
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
