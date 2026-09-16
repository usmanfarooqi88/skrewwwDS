// Imported, but from a non-Skrewww, user-owned module path — provenance
// must classify this import's module specifier as "unknown", never as
// the real @/components/ui Button, regardless of the identifier name.
import { Button } from "./local-button";

export function Example() {
  return <Button fakeProp="not the real Button" />;
}
