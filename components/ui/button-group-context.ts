"use client";

import { createContext, useContext } from "react";

/**
 * When true, Button applies joined-item geometry for ButtonGroup:
 * zero individual radius (except first/last via group CSS), transparent
 * border, and no squircle clip that would fight the shared outer chrome.
 */
export const ButtonGroupContext = createContext(false);

export function useButtonGroupItem(): boolean {
  return useContext(ButtonGroupContext);
}
