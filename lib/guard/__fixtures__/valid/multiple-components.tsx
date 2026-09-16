import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function Example() {
  return (
    <Card title="Requests">
      <Badge variant="success">Open</Badge>
      <Button variant="secondary">View</Button>
    </Card>
  );
}
