import { Button as PrimaryAction } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// A user-owned wrapper around a real Skrewww primitive — must never
// contribute a false finding for its own outer call site.
function RowAction(props: { onClick?: () => void; "data-testid"?: string }) {
  return (
    <PrimaryAction
      {...props}
      variant="secondary"
      size="sm"
      aria-label="Row action"
      data-row-id="req_001"
      disabled
      loading={false}
    >
      Open
    </PrimaryAction>
  );
}

export function Example({ dynamicSize }: { dynamicSize: "sm" | "md" | "lg" }) {
  return (
    <Card title="Requests" className="wrapper" aria-live="polite">
      <PrimaryAction variant="primary" size={dynamicSize}>
        Continue
      </PrimaryAction>
      <RowAction data-testid="row-1" />
    </Card>
  );
}
