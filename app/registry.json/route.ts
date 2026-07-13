import { getPublicRegistry, serializePublicRegistry } from "@/lib/registry-public";

export const dynamic = "force-static";

export function GET() {
  return new Response(serializePublicRegistry(), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
