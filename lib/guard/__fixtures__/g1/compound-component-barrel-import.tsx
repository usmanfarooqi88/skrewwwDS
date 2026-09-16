import { Drawer, DrawerTrigger, DrawerContent, DrawerBody } from "@/components/ui";

export function Example() {
  return (
    <Drawer>
      <DrawerTrigger>Open</DrawerTrigger>
      <DrawerContent>
        <DrawerBody>Content</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
