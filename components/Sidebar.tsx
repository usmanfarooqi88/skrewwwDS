import Link from "next/link";
import Image from "next/image";
import { SidebarNav } from "@/components/SidebarNav";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 overflow-y-auto border-r border-ink-200 bg-white/80 backdrop-blur-sm md:block">
      <div className="flex h-16 items-center border-b border-ink-200 px-5">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/logo.svg"
            alt="skrewww"
            width={590}
            height={161}
            className="h-6 w-auto"
            priority
          />
        </Link>
      </div>

      <SidebarNav />
    </aside>
  );
}
