"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/Menu";
import { REFERENCE_OWNERS } from "@/lib/reference-app/fixtures";

const CURRENT_USER = REFERENCE_OWNERS[0];

export function ReferenceUserMenu() {
  return (
    <Menu>
      <MenuTrigger>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={`Account menu for ${CURRENT_USER.name}`}
          leadingIcon={
            <Avatar
              size="sm"
              initials={CURRENT_USER.initials}
              label={CURRENT_USER.name}
              decorative
            />
          }
        >
          {CURRENT_USER.initials}
        </Button>
      </MenuTrigger>
      <MenuContent aria-label="Account">
        <MenuLabel>{CURRENT_USER.name}</MenuLabel>
        <MenuSeparator />
        <MenuItem disabled>Profile (later)</MenuItem>
        <MenuItem disabled>Sign out (later)</MenuItem>
      </MenuContent>
    </Menu>
  );
}
