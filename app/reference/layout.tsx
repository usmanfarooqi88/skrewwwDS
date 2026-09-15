import type { Metadata } from "next";
import { ReferenceShell } from "@/components/reference-app/ReferenceShell";

export const metadata: Metadata = {
  title: "Reference App",
  description:
    "Composition validation workspace for Skrewww — ops console shell and fixtures.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
  return <ReferenceShell>{children}</ReferenceShell>;
}
