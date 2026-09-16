import { CommandPalette } from "@/components/ui/CommandPalette";

// Dummy sensitive-looking value — Guard must never echo this in diagnostics.
const SECRET_TEST_VALUE = "do-not-print-this-value";

export function Example() {
  void SECRET_TEST_VALUE;
  return <CommandPalette />;
}
