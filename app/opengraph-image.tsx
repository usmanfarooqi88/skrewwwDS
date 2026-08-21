import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #ffffff 0%, #f7f7f8 100%)",
          color: "#131316",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#6C4CF2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Skrewww</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            Skrewww Design System
          </div>
          <div style={{ marginTop: 24, fontSize: 30, color: "#52545C", maxWidth: 820 }}>
            AI-first, multi-style component documentation
          </div>
        </div>
        <div style={{ fontSize: 22, color: "#6C4CF2", fontWeight: 600 }}>
          Token-driven · Native controls · React implementations
        </div>
      </div>
    ),
    size,
  );
}
