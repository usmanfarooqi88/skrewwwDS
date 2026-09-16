import { Button } from "@/components/ui/Button";

export function Example(props: { onClick: () => void }) {
  // Spread + an explicit literal attribute together — the explicit
  // attribute name is knowable, the spread's own contents are not.
  return <Button {...props} variant="primary" />;
}
