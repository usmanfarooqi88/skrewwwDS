import { Button } from "@/components/ui/Button";

export function Example({ size }: { size: "sm" | "md" | "lg" }) {
  return <Button variant="primary" size={size} />;
}
