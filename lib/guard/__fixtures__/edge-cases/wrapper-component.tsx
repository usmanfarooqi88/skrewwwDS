import { Button } from "@/components/ui/Button";

// A user-owned wrapper around a real Skrewww primitive. The inner
// <Button {...props} /> resolves to a real, known Skrewww import; the
// outer <MyButton fakeProp="x" /> call site below must remain
// unresolved/local — never traced through MyButton's body.
function MyButton(props: { fakeProp?: string; onClick?: () => void }) {
  return <Button {...props} />;
}

export function Example() {
  return <MyButton fakeProp="x" />;
}
