import { Button } from "@/components/ui/Button";
import DefaultThing from "some-module";
import * as NS from "some-namespace";

export function Example() {
  return (
    <>
      <Button variant="primary">Go</Button>
      <span>{DefaultThing}</span>
      <span>{NS.toString()}</span>
    </>
  );
}
